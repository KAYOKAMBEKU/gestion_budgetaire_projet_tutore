from decimal import Decimal
from datetime import datetime
from io import BytesIO

from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
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


def _money(value: Decimal) -> str:
    return f"{value:,.2f} FCFA".replace(",", " ")


def _paragraph(text, style):
    return Paragraph(str(text or ""), style)


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
        "Ecart recettes",
        "Ecart depenses",
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
    total_prevu = sum(row["prevu"] for row in rows)
    total_realise = sum(row["realise"] for row in rows)
    total_recettes_prevues = sum(row["recettes_prevues"] for row in rows)
    total_recettes_realisees = sum(row["recettes_realisees"] for row in rows)
    total_depenses_prevues = sum(row["depenses_prevues"] for row in rows)
    total_depenses_realisees = sum(row["depenses_realisees"] for row in rows)
    taux_global = (total_realise / total_prevu * Decimal("100")) if total_prevu > 0 else Decimal("0")

    summary_rows = [
        ["Budgets analyses", str(len(rows))],
        ["Total previsionnel", _money(total_prevu)],
        ["Total realise", _money(total_realise)],
        ["Ecart global", _money(total_realise - total_prevu)],
        ["Taux execution global", f"{taux_global:.2f}%"],
        ["Recettes prevues / realisees", f"{_money(total_recettes_prevues)} / {_money(total_recettes_realisees)}"],
        ["Depenses prevues / realisees", f"{_money(total_depenses_prevues)} / {_money(total_depenses_realisees)}"],
    ]

    if type_rapport == "departements":
        grouped: dict[str, dict[str, Decimal | int | str]] = {}
        for row in rows:
            item = grouped.setdefault(row["departement"], {"departement": row["departement"], "budgets": 0, "prevu": Decimal("0"), "realise": Decimal("0")})
            item["budgets"] = int(item["budgets"]) + 1
            item["prevu"] = Decimal(item["prevu"]) + row["prevu"]
            item["realise"] = Decimal(item["realise"]) + row["realise"]
        detail_headers = ["Departement", "Budgets", "Prevu", "Realise", "Ecart", "Taux"]
        detail_rows = []
        for item in grouped.values():
            prevu = Decimal(item["prevu"])
            realise = Decimal(item["realise"])
            taux = (realise / prevu * Decimal("100")) if prevu > 0 else Decimal("0")
            detail_rows.append(
                [
                    str(item["departement"]),
                    str(item["budgets"]),
                    _money(prevu),
                    _money(realise),
                    _money(realise - prevu),
                    f"{taux:.2f}%",
                ]
            )
    else:
        detail_headers = ["Projet", "Departement", "Exercice", "Statut", "Prevu", "Realise", "Ecart", "Taux", "Interpretation"]
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
                row["exercice"],
                row["budget"].statut,
                _money(row["prevu"]),
                _money(row["realise"]),
                _money(row["ecart"]),
                f"{row['taux']:.2f}%",
                interpretation,
            ]
            if type_rapport == "execution":
                detail_row.extend([_money(row["recettes_realisees"]), _money(row["depenses_realisees"])])
            if type_rapport == "ecarts":
                detail_row.extend(
                    [
                        _money(row["recettes_realisees"] - row["recettes_prevues"]),
                        _money(row["depenses_realisees"] - row["depenses_prevues"]),
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
