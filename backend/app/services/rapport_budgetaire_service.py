from decimal import Decimal
from datetime import datetime
from io import BytesIO

from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Circle, Drawing, String
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.budget import Budget
from app.models.ecart_budgetaire import EcartBudgetaire
from app.models.rapport_budgetaire import RapportBudgetaire
from app.schemas.rapport_budgetaire import RapportBudgetaireCreate, RapportBudgetaireUpdate
from app.services._utils import schema_to_dict, update_model

REPORT_OUTPUT_LABELS = {
    "general": "Etat general budgetaire",
    "execution": "Etat d'execution budgetaire",
    "ecarts": "Etat des ecarts",
    "entrees": "Etat des entrees",
    "sorties": "Etat des sorties",
    "departements": "Etat par departement",
}

TRACKED_BUDGET_STATUSES = {
    "brouillon",
    "soumis",
    "soumis_gestionnaire",
    "valide",
    "valide_gestionnaire",
    "soumis_admin",
    "approuve_admin",
    "rejete",
    "rejete_gestionnaire",
    "rejete_admin",
    "en_execution",
    "execute",
    "cloture",
}


def _decimal(value) -> Decimal:
    return Decimal(value or 0)


def _budget_devise(budget: Budget) -> str:
    return "USD" if budget.devise == "USD" else "FC"


def _money(value: Decimal, devise: str = "FC") -> str:
    suffix = "USD" if devise == "USD" else "FC"
    return f"{value:,.2f} {suffix}".replace(",", " ")


def _paragraph(text, style):
    return Paragraph(str(text or ""), style)


def _line_category_name(ligne) -> str:
    if ligne.sous_titre:
        return str(ligne.sous_titre)
    if ligne.categorie:
        return str(ligne.categorie.nom)
    return str(ligne.grand_titre or "Non classe")


def _budget_line_amount_realise(ligne, mouvements) -> Decimal:
    expected_type = "entree" if ligne.type_ligne == "recette" else "sortie"
    return sum(
        _decimal(mouvement.montant)
        for mouvement in mouvements
        if mouvement.type_mouvement == expected_type and mouvement.ligne_budgetaire_id == ligne.id
    )


def _category_color(index: int):
    palette = [
        colors.HexColor("#ff5a1f"),
        colors.HexColor("#0ea5e9"),
        colors.HexColor("#facc15"),
        colors.HexColor("#e879f9"),
        colors.HexColor("#22c55e"),
        colors.HexColor("#8b5cf6"),
        colors.HexColor("#14b8a6"),
        colors.HexColor("#f97316"),
    ]
    return palette[index % len(palette)]


def _build_donut_chart(category_totals: list[tuple[str, Decimal]], devise: str) -> Drawing:
    drawing = Drawing(25 * cm, 7.2 * cm)
    positive_totals = [(label, total) for label, total in category_totals if total > 0]
    if not positive_totals:
        drawing.add(String(9.3 * cm, 3.4 * cm, "Aucune depense prevue", fontName="Helvetica-Bold", fontSize=12, fillColor=colors.HexColor("#6b7280")))
        return drawing

    pie = Pie()
    pie.x = 8.9 * cm
    pie.y = 0.5 * cm
    pie.width = 6.2 * cm
    pie.height = 6.2 * cm
    pie.data = [float(total) for _, total in positive_totals]
    pie.labels = None
    pie.sideLabels = False
    pie.slices.strokeColor = colors.white
    pie.slices.strokeWidth = 1
    for index, _item in enumerate(positive_totals):
        pie.slices[index].fillColor = _category_color(index)
    drawing.add(pie)
    drawing.add(Circle(12 * cm, 3.6 * cm, 1.65 * cm, fillColor=colors.white, strokeColor=colors.white))
    drawing.add(String(11.05 * cm, 3.75 * cm, "SORTIES", fontName="Helvetica-Bold", fontSize=11, fillColor=colors.HexColor("#1f2937")))
    drawing.add(String(10.7 * cm, 3.25 * cm, "PAR CATEGORIE", fontName="Helvetica", fontSize=8, fillColor=colors.HexColor("#6b7280")))

    for index, (label, total) in enumerate(positive_totals[:8]):
        x = 0.4 * cm if index < 4 else 17.0 * cm
        y = (6.2 - (index % 4) * 1.25) * cm
        color = _category_color(index)
        drawing.add(Circle(x, y + 0.08 * cm, 0.12 * cm, fillColor=color, strokeColor=color))
        drawing.add(String(x + 0.35 * cm, y, f"{label}; {_money(total, devise)}", fontName="Helvetica-Bold", fontSize=8, fillColor=color))
    return drawing


def generate_budget_lines_state_pdf(db: Session, budget_id: int) -> tuple[str, bytes] | None:
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget is None:
        return None

    from app.models.mouvement_financier import MouvementFinancier
    from app.services.mouvement_financier_service import recalculate_budget_realisations

    recalculate_budget_realisations(db, budget.id)
    db.refresh(budget)
    mouvements = db.query(MouvementFinancier).filter(MouvementFinancier.budget_id == budget.id).all()
    devise = _budget_devise(budget)
    lignes = list(budget.lignes_budgetaires)
    recettes_prevues = sum(_decimal(ligne.montant_prevu) for ligne in lignes if ligne.type_ligne == "recette")
    depenses_prevues = sum(_decimal(ligne.montant_prevu) for ligne in lignes if ligne.type_ligne == "depense")
    recettes_realisees = _decimal(budget.total_recettes_realisees)
    depenses_realisees = _decimal(budget.total_depenses_realisees or budget.montant_total_realise)
    restant_prevu = recettes_prevues - depenses_prevues
    restant_realise = recettes_realisees - depenses_realisees

    category_totals: dict[str, Decimal] = {}
    for ligne in lignes:
        if ligne.type_ligne != "depense":
            continue
        category = _line_category_name(ligne)
        category_totals[category] = category_totals.get(category, Decimal("0")) + _decimal(ligne.montant_prevu)
    ordered_categories = sorted(category_totals.items(), key=lambda item: item[1], reverse=True)

    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.0 * cm,
        bottomMargin=1.0 * cm,
        title="Etat des lignes budgetaires",
    )
    styles = getSampleStyleSheet()
    body_style = ParagraphStyle("LineStateBody", parent=styles["BodyText"], fontSize=8, leading=10)
    small_style = ParagraphStyle("LineStateSmall", parent=body_style, fontSize=7, leading=9, textColor=colors.HexColor("#4b5563"))
    header_style = ParagraphStyle("LineStateHeader", parent=body_style, fontName="Helvetica-Bold", textColor=colors.white, alignment=TA_CENTER)
    amount_style = ParagraphStyle("LineStateAmount", parent=body_style, alignment=TA_RIGHT)
    title_style = ParagraphStyle("LineStateTitle", parent=styles["Title"], fontSize=16, leading=20, textColor=colors.HexColor("#111827"), spaceAfter=3)
    subtitle_style = ParagraphStyle("LineStateSubtitle", parent=styles["Normal"], fontSize=9, leading=12, textColor=colors.HexColor("#4b5563"))
    section_style = ParagraphStyle("LineStateSection", parent=styles["Heading2"], fontSize=11, leading=14, textColor=colors.HexColor("#111827"), spaceBefore=4, spaceAfter=6, keepWithNext=True)

    story = [
        _paragraph("ETAT DE SORTIE", subtitle_style),
        _paragraph("LIGNES BUDGETAIRES", title_style),
        _paragraph(
            f"Budget: {budget.reference} - {budget.libelle} | Projet: {budget.projet.titre if budget.projet else budget.projet_id} | Genere le {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            subtitle_style,
        ),
        Spacer(1, 0.25 * cm),
    ]

    top_table = Table(
        [
            [_paragraph("Entrees", header_style), _paragraph("Depenses", header_style), _paragraph("Restant", header_style)],
            [_paragraph(_money(recettes_prevues, devise), amount_style), _paragraph(_money(depenses_prevues, devise), amount_style), _paragraph(_money(restant_prevu, devise), amount_style)],
            [_paragraph(f"Realise: {_money(recettes_realisees, devise)}", small_style), _paragraph(f"Realise: {_money(depenses_realisees, devise)}", small_style), _paragraph(f"Realise: {_money(restant_realise, devise)}", small_style)],
        ],
        colWidths=[8.2 * cm, 8.2 * cm, 8.2 * cm],
    )
    top_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#fb923c")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#0f7fcf")),
                ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#70ad47")),
                ("GRID", (0, 0), (-1, -1), 0.7, colors.black),
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 1), (-1, 1), 13),
                ("ALIGN", (0, 1), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([_paragraph("1. Synthese generale du budget", section_style), top_table, Spacer(1, 0.5 * cm)])

    line_rows = [[_paragraph("Type", header_style), _paragraph("Prevu", header_style), _paragraph("Realise", header_style), _paragraph("Categorie", header_style), _paragraph("Etat", header_style)]]
    row_backgrounds = []
    for index, ligne in enumerate(lignes):
        realised = _budget_line_amount_realise(ligne, mouvements)
        planned = _decimal(ligne.montant_prevu)
        ecart = realised - planned
        is_over_budget = ligne.type_ligne == "depense" and realised > planned
        label = ligne.activite or ligne.libelle
        if ligne.activite and ligne.libelle != ligne.activite:
            label = f"{ligne.activite}<br/><font size='7'>{ligne.libelle}</font>"
        line_rows.append(
            [
                _paragraph(label, body_style),
                _paragraph(_money(planned, devise), amount_style),
                _paragraph(_money(realised, devise), amount_style),
                _paragraph(_line_category_name(ligne), body_style),
                _paragraph("Depassement" if is_over_budget else ("OK" if ligne.type_ligne == "depense" else "Entree"), body_style),
            ]
        )
        row_backgrounds.append((index + 1, colors.HexColor("#fee2e2") if is_over_budget else colors.white, ecart))

    line_table = Table(line_rows, colWidths=[7.0 * cm, 4.2 * cm, 4.2 * cm, 6.5 * cm, 2.7 * cm], repeatRows=1)
    line_styles = [
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#fb923c")),
        ("BACKGROUND", (1, 0), (2, 0), colors.HexColor("#0f7fcf")),
        ("BACKGROUND", (3, 0), (4, 0), colors.HexColor("#70ad47")),
        ("GRID", (0, 0), (-1, -1), 0.6, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for row_index, background, _ecart in row_backgrounds:
        line_styles.append(("BACKGROUND", (0, row_index), (-1, row_index), background))
    line_table.setStyle(TableStyle(line_styles))
    story.extend([_paragraph("2. Detail des lignes budgetaires", section_style), line_table, Spacer(1, 0.5 * cm)])

    category_rows = [[_paragraph("Categorie", header_style), _paragraph("Budget", header_style)]]
    for index, (category, total) in enumerate(ordered_categories):
        category_rows.append([_paragraph(category, body_style), _paragraph(_money(total, devise), amount_style)])
    category_rows.append([_paragraph("Total", body_style), _paragraph(_money(depenses_prevues, devise), amount_style)])
    category_table = Table(category_rows, colWidths=[10 * cm, 7 * cm], hAlign="LEFT")
    category_styles = [
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#ef4444")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#0f7fcf")),
        ("GRID", (0, 0), (-1, -1), 0.6, colors.black),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for index, _item in enumerate(ordered_categories, start=1):
        category_styles.append(("BACKGROUND", (0, index), (0, index), _category_color(index - 1)))
    category_table.setStyle(TableStyle(category_styles))
    story.extend(
        [
            _paragraph("3. Synthese des depenses par categorie", section_style),
            category_table,
            Spacer(1, 0.4 * cm),
            _paragraph("4. Repartition graphique des depenses", section_style),
            _build_donut_chart(ordered_categories, devise),
        ]
    )

    document.build(story)
    filename = f"etat-lignes-budgetaires-{budget.reference}.pdf"
    return filename, buffer.getvalue()


def _detail_col_widths(headers: list[str]) -> list[float]:
    available_width = landscape(A4)[0] - (2.4 * cm)
    weights_by_header = {
        "Projet": 2.2,
        "Departement": 1.8,
        "Exercice": 1.4,
        "Statut": 1.2,
        "Interpretation": 1.3,
        "Recettes realisees": 1.6,
        "Depenses realisees": 1.6,
        "Ecart recettes": 1.5,
        "Ecart depenses": 1.5,
        "Solde realise": 1.5,
    }
    weights = [weights_by_header.get(header, 1.2) for header in headers]
    total_weight = sum(weights)
    return [available_width * weight / total_weight for weight in weights]


def _build_pdf(title: str, now: str, summary_rows: list[list[str]], detail_headers: list[str], detail_rows: list[list[str]]) -> bytes:
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        title=title,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#1f2937"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4b5563"),
        spaceAfter=10,
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["BodyText"],
        fontSize=8,
        leading=10,
    )
    header_style = ParagraphStyle(
        "ReportHeader",
        parent=body_style,
        fontName="Helvetica-Bold",
        textColor=colors.white,
        alignment=1,
    )
    amount_style = ParagraphStyle(
        "ReportAmount",
        parent=body_style,
        alignment=TA_RIGHT,
    )

    story = [
        _paragraph("GESTION BUDGETAIRE", subtitle_style),
        _paragraph(title.upper(), title_style),
        _paragraph(f"Genere le {now}", subtitle_style),
    ]

    summary_table = Table(
        [[_paragraph(label, body_style), _paragraph(value, amount_style)] for label, value in summary_rows],
        colWidths=[7 * cm, 6 * cm],
        hAlign="LEFT",
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.extend([summary_table, Spacer(1, 0.45 * cm)])

    numeric_headers = {
        "Budgets",
        "Prevu",
        "Realise",
        "Ecart",
        "Taux",
        "Recettes realisees",
        "Depenses realisees",
        "Entrees prevues",
        "Entrees realisees",
        "Sorties prevues",
        "Sorties realisees",
        "Ecart recettes",
        "Ecart depenses",
        "Solde realise",
    }
    table_data = [[_paragraph(header, header_style) for header in detail_headers]]
    for row in detail_rows:
        table_data.append(
            [
                _paragraph(value, amount_style if detail_headers[index] in numeric_headers else body_style)
                for index, value in enumerate(row)
            ]
        )

    detail_table = Table(table_data, colWidths=_detail_col_widths(detail_headers), repeatRows=1, hAlign="LEFT")
    detail_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(detail_table)
    document.build(story)
    return buffer.getvalue()


def _budget_report_rows(db: Session):
    budgets = db.query(Budget).filter(Budget.statut.in_(TRACKED_BUDGET_STATUSES)).all()
    rows = []
    for budget in budgets:
        recettes_prevues = sum(_decimal(ligne.montant_prevu) for ligne in budget.lignes_budgetaires if ligne.type_ligne == "recette")
        depenses_prevues = sum(_decimal(ligne.montant_prevu) for ligne in budget.lignes_budgetaires if ligne.type_ligne == "depense")
        prevu = _decimal(budget.montant_total_prevu)
        realise = _decimal(budget.montant_total_realise)
        ecart = realise - prevu
        taux = (realise / prevu * Decimal("100")) if prevu > 0 else Decimal("0")
        rows.append(
            {
                "budget": budget,
                "devise": _budget_devise(budget),
                "departement": budget.departement.nom if budget.departement else f"Departement {budget.departement_id}",
                "exercice": budget.exercice.libelle if budget.exercice else f"Exercice {budget.exercice_id}",
                "projet": budget.projet.titre if budget.projet else str(budget.projet_id or "-"),
                "prevu": prevu,
                "realise": realise,
                "ecart": ecart,
                "taux": taux,
                "recettes_prevues": recettes_prevues,
                "depenses_prevues": depenses_prevues,
                "recettes_realisees": _decimal(budget.total_recettes_realisees),
                "depenses_realisees": _decimal(budget.total_depenses_realisees or budget.montant_total_realise),
            }
        )
    return rows


def generate_admin_budget_report_pdf(db: Session, type_rapport: str = "general") -> tuple[str, bytes]:
    if type_rapport not in REPORT_OUTPUT_LABELS:
        raise ValueError("Type de rapport invalide.")

    rows = _budget_report_rows(db)
    title = REPORT_OUTPUT_LABELS[type_rapport]
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    totals_by_devise = {}
    for row in rows:
        totals = totals_by_devise.setdefault(
            row["devise"],
            {
                "prevu": Decimal("0"),
                "realise": Decimal("0"),
                "recettes_prevues": Decimal("0"),
                "recettes_realisees": Decimal("0"),
                "depenses_prevues": Decimal("0"),
                "depenses_realisees": Decimal("0"),
            },
        )
        totals["prevu"] += row["prevu"]
        totals["realise"] += row["realise"]
        totals["recettes_prevues"] += row["recettes_prevues"]
        totals["recettes_realisees"] += row["recettes_realisees"]
        totals["depenses_prevues"] += row["depenses_prevues"]
        totals["depenses_realisees"] += row["depenses_realisees"]

    summary_rows = [["Budgets analyses", str(len(rows))]]
    risk_rows = [
        row
        for row in rows
        if row["depenses_prevues"] > 0 and (row["depenses_realisees"] / row["depenses_prevues"] * Decimal("100")) >= Decimal("90")
    ]
    summary_rows.append(["Alertes grand risque de depassement", str(len(risk_rows))])
    for devise in ("FC", "USD"):
        totals = totals_by_devise.get(devise)
        if totals is None:
            continue
        taux = (totals["realise"] / totals["prevu"] * Decimal("100")) if totals["prevu"] > 0 else Decimal("0")
        summary_rows.extend(
            [
                [f"Total previsionnel {devise}", _money(totals["prevu"], devise)],
                [f"Total realise {devise}", _money(totals["realise"], devise)],
                [f"Ecart global {devise}", _money(totals["realise"] - totals["prevu"], devise)],
                [f"Taux execution {devise}", f"{taux:.2f}%"],
                [f"Recettes prevues / realisees {devise}", f"{_money(totals['recettes_prevues'], devise)} / {_money(totals['recettes_realisees'], devise)}"],
                [f"Depenses prevues / realisees {devise}", f"{_money(totals['depenses_prevues'], devise)} / {_money(totals['depenses_realisees'], devise)}"],
                [f"Solde realise {devise}", _money(totals["recettes_realisees"] - totals["depenses_realisees"], devise)],
            ]
        )

    if type_rapport == "departements":
        grouped: dict[str, dict[str, Decimal | int | str]] = {}
        for row in rows:
            key = f"{row['departement']}|{row['devise']}"
            item = grouped.setdefault(key, {"departement": row["departement"], "devise": row["devise"], "budgets": 0, "prevu": Decimal("0"), "realise": Decimal("0")})
            item["budgets"] = int(item["budgets"]) + 1
            item["prevu"] = Decimal(item["prevu"]) + row["prevu"]
            item["realise"] = Decimal(item["realise"]) + row["realise"]
        detail_headers = ["Departement", "Devise", "Budgets", "Prevu", "Realise", "Ecart", "Taux"]
        detail_rows = []
        for item in grouped.values():
            prevu = Decimal(item["prevu"])
            realise = Decimal(item["realise"])
            devise = str(item["devise"])
            taux = (realise / prevu * Decimal("100")) if prevu > 0 else Decimal("0")
            detail_rows.append(
                [
                    str(item["departement"]),
                    devise,
                    str(item["budgets"]),
                    _money(prevu, devise),
                    _money(realise, devise),
                    _money(realise - prevu, devise),
                    f"{taux:.2f}%",
                ]
            )
    elif type_rapport in {"entrees", "sorties"}:
        if type_rapport == "entrees":
            detail_headers = ["Projet", "Departement", "Devise", "Exercice", "Statut", "Entrees prevues", "Entrees realisees", "Ecart", "Taux", "Solde realise"]
        else:
            detail_headers = ["Projet", "Departement", "Devise", "Exercice", "Statut", "Sorties prevues", "Sorties realisees", "Ecart", "Taux", "Solde realise"]

        detail_rows = []
        for row in rows:
            if type_rapport == "entrees":
                prevu = row["recettes_prevues"]
                realise = row["recettes_realisees"]
            else:
                prevu = row["depenses_prevues"]
                realise = row["depenses_realisees"]
            ecart = realise - prevu
            taux = (realise / prevu * Decimal("100")) if prevu > 0 else Decimal("0")
            solde_realise = row["recettes_realisees"] - row["depenses_realisees"]
            detail_rows.append(
                [
                    row["projet"],
                    row["departement"],
                    row["devise"],
                    row["exercice"],
                    row["budget"].statut,
                    _money(prevu, row["devise"]),
                    _money(realise, row["devise"]),
                    _money(ecart, row["devise"]),
                    f"{taux:.2f}%",
                    _money(solde_realise, row["devise"]),
                ]
            )
    else:
        detail_headers = ["Projet", "Departement", "Devise", "Exercice", "Statut", "Prevu", "Realise", "Ecart", "Taux", "Interpretation"]
        if type_rapport == "execution":
            detail_headers.extend(["Recettes realisees", "Depenses realisees"])
        if type_rapport == "ecarts":
            detail_headers.extend(["Ecart recettes", "Ecart depenses"])

        detail_rows = []
        for row in rows:
            interpretation = "Conforme" if abs(row["ecart"]) < Decimal("1") else ("Defavorable" if row["ecart"] > 0 else "Favorable")
            detail_row = [
                row["projet"],
                row["departement"],
                row["devise"],
                row["exercice"],
                row["budget"].statut,
                _money(row["prevu"], row["devise"]),
                _money(row["realise"], row["devise"]),
                _money(row["ecart"], row["devise"]),
                f"{row['taux']:.2f}%",
                interpretation,
            ]
            if type_rapport == "execution":
                detail_row.extend([_money(row["recettes_realisees"], row["devise"]), _money(row["depenses_realisees"], row["devise"])])
            if type_rapport == "ecarts":
                detail_row.extend(
                    [
                        _money(row["recettes_realisees"] - row["recettes_prevues"], row["devise"]),
                        _money(row["depenses_realisees"] - row["depenses_prevues"], row["devise"]),
                    ]
                )
            detail_rows.append(detail_row)

    filename = f"{title.lower().replace(' ', '-')}.pdf"
    return filename, _build_pdf(title, now, summary_rows, detail_headers, detail_rows)


def get_rapport_by_id(db: Session, rapport_id: int):
    return db.query(RapportBudgetaire).filter(RapportBudgetaire.id == rapport_id).first()


def get_by_id(db: Session, id: int):
    return get_rapport_by_id(db, id)


def get_rapports(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RapportBudgetaire).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_rapports(db, skip, limit)


def get_rapports_by_budget(db: Session, budget_id: int):
    return db.query(RapportBudgetaire).filter(RapportBudgetaire.budget_id == budget_id).all()


def get_rapports_by_user(db: Session, utilisateur_id: int):
    return db.query(RapportBudgetaire).filter(RapportBudgetaire.utilisateur_id == utilisateur_id).all()


def create_rapport(db: Session, rapport_in: RapportBudgetaireCreate):
    rapport = RapportBudgetaire(**schema_to_dict(rapport_in, exclude_unset=False))
    db.add(rapport)
    db.commit()
    db.refresh(rapport)
    return rapport


def create(db: Session, obj_in: RapportBudgetaireCreate):
    return create_rapport(db, obj_in)


def update_rapport(db: Session, rapport_id: int, rapport_in: RapportBudgetaireUpdate):
    rapport = get_rapport_by_id(db, rapport_id)
    if rapport is None:
        return None
    update_model(rapport, rapport_in)
    db.commit()
    db.refresh(rapport)
    return rapport


def update(db: Session, db_obj, obj_in: RapportBudgetaireUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_rapport(db: Session, rapport_id: int):
    rapport = get_rapport_by_id(db, rapport_id)
    if rapport is None:
        return None
    db.delete(rapport)
    db.commit()
    return rapport


def delete(db: Session, id: int):
    return delete_rapport(db, id)


def generate_budget_summary(db: Session, budget_id: int):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget is None:
        return None
    lignes = budget.lignes_budgetaires
    total_prevu = Decimal(budget.montant_total_prevu or 0)
    total_realise = Decimal(budget.montant_total_realise or 0)
    taux_execution = (total_realise / total_prevu) * Decimal("100") if total_prevu > 0 else Decimal("0")
    ligne_ids = [ligne.id for ligne in lignes]
    lignes_en_ecart = sum(1 for ligne in lignes if Decimal(ligne.ecart_montant or 0) != 0)
    ecarts_critiques = 0
    if ligne_ids:
        ecarts_critiques = db.query(EcartBudgetaire).filter(
            EcartBudgetaire.ligne_budgetaire_id.in_(ligne_ids),
            EcartBudgetaire.niveau_alerte == "critique",
        ).count()
    # Donnees pretes pour un futur export PDF/Excel.
    return {
        "budget": budget,
        "total_prevu": total_prevu,
        "total_realise": total_realise,
        "ecart_total": Decimal(budget.ecart_total or 0),
        "nombre_lignes": len(lignes),
        "lignes_en_ecart": lignes_en_ecart,
        "ecarts_critiques": ecarts_critiques,
        "taux_execution": taux_execution,
    }
