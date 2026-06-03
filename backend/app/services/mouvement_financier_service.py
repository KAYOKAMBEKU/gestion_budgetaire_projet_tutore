from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.ligne_budgetaire import LigneBudgetaire
from app.models.mouvement_financier import MouvementFinancier
from app.models.projet import Projet
from app.models.user import User
from app.schemas.mouvement_financier import MouvementFinancierCreate, MouvementFinancierUpdate
from app.services._utils import decimal_sum, schema_to_dict, update_model
from datetime import datetime
import random

ROLE_COMPTABLE = "comptable"
VALID_TYPES = {"entree", "sortie"}
EXECUTION_STATUS = "en_execution"


def _has_comptable_role(user: User | None) -> bool:
    if user is None:
        return False
    return any((role.nom_role or "").strip().lower() == ROLE_COMPTABLE for role in user.roles)


def _require_comptable(user: User | None) -> None:
    if not _has_comptable_role(user):
        raise PermissionError("Seul un utilisateur ayant le role 'Comptable' peut gerer les mouvements financiers.")


def _validate_project_budget(db: Session, projet_id: int, budget_id: int) -> tuple[Projet, Budget]:
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if projet is None:
        raise ValueError("Projet introuvable")
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget is None:
        raise ValueError("Budget introuvable")
    if budget.projet_id != projet.id:
        raise ValueError("Le budget ne correspond pas au projet indique")
    if budget.statut != EXECUTION_STATUS:
        raise ValueError("Les mouvements financiers ne sont autorises que pendant l'execution du budget.")
    return projet, budget


def _validate_ligne_for_mouvement(
    db: Session,
    type_mouvement: str,
    budget_id: int,
    ligne_budgetaire_id: int | None,
) -> LigneBudgetaire:
    if type_mouvement not in VALID_TYPES:
        raise ValueError("type_mouvement doit etre 'entree' ou 'sortie'")
    if ligne_budgetaire_id is None:
        raise ValueError("ligne_budgetaire_id est obligatoire pour un mouvement financier.")
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.id == ligne_budgetaire_id).first()
    if ligne is None:
        raise ValueError("Ligne budgetaire introuvable")
    if ligne.budget_id != budget_id:
        raise ValueError("La ligne budgetaire doit appartenir au budget du projet")
    if type_mouvement == "sortie" and ligne.type_ligne != "depense":
        raise ValueError("Une sortie doit etre rattachee a une ligne budgetaire de type depense")
    if type_mouvement == "entree" and ligne.type_ligne != "recette":
        raise ValueError("Une entree doit etre rattachee a une ligne budgetaire de type recette")
    return ligne


def get_mouvement_by_id(db: Session, mouvement_id: int):
    return db.query(MouvementFinancier).filter(MouvementFinancier.id == mouvement_id).first()


def get_mouvements(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    projet_id: int | None = None,
    budget_id: int | None = None,
    type_mouvement: str | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
):
    query = db.query(MouvementFinancier)
    if projet_id is not None:
        query = query.filter(MouvementFinancier.projet_id == projet_id)
    if budget_id is not None:
        query = query.filter(MouvementFinancier.budget_id == budget_id)
    if type_mouvement is not None:
        if type_mouvement not in VALID_TYPES:
            raise ValueError("type_mouvement doit etre 'entree' ou 'sortie'")
        query = query.filter(MouvementFinancier.type_mouvement == type_mouvement)
    if date_debut is not None:
        query = query.filter(MouvementFinancier.date_mouvement >= date_debut)
    if date_fin is not None:
        query = query.filter(MouvementFinancier.date_mouvement <= date_fin)
    return query.order_by(MouvementFinancier.date_mouvement.desc(), MouvementFinancier.id.desc()).offset(skip).limit(limit).all()


def get_mouvements_by_project(db: Session, projet_id: int, **filters):
    return get_mouvements(db, projet_id=projet_id, **filters)


def get_mouvements_by_budget(db: Session, budget_id: int, **filters):
    return get_mouvements(db, budget_id=budget_id, **filters)


def _recalculate_ligne_from_mouvements(db: Session, ligne_id: int | None) -> None:
    if ligne_id is None:
        return
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.id == ligne_id).first()
    if ligne is None:
        return
    if ligne.type_ligne == "depense":
        total = decimal_sum(
            mouvement.montant
            for mouvement in db.query(MouvementFinancier).filter(
                MouvementFinancier.ligne_budgetaire_id == ligne.id,
                MouvementFinancier.type_mouvement == "sortie",
            )
        )
    else:
        # recette
        total = decimal_sum(
            mouvement.montant
            for mouvement in db.query(MouvementFinancier).filter(
                MouvementFinancier.ligne_budgetaire_id == ligne.id,
                MouvementFinancier.type_mouvement == "entree",
            )
        )

    ligne.montant_realise = total
    ligne.ecart_montant = Decimal(ligne.montant_realise or 0) - Decimal(ligne.montant_prevu or 0)
    if Decimal(ligne.montant_prevu or 0) > 0:
        ligne.ecart_pourcentage = (ligne.ecart_montant / Decimal(ligne.montant_prevu)) * Decimal("100")
    else:
        ligne.ecart_pourcentage = Decimal("0")


def _recalculate_all_budget_lignes(db: Session, budget: Budget) -> None:
    for ligne in budget.lignes_budgetaires:
        _recalculate_ligne_from_mouvements(db, ligne.id)
    db.flush()


def recalculate_budget_realisations(db: Session, budget_id: int):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget is None:
        return None

    _recalculate_all_budget_lignes(db, budget)
    mouvements = db.query(MouvementFinancier).filter(MouvementFinancier.budget_id == budget.id).all()
    total_recettes = decimal_sum(m.montant for m in mouvements if m.type_mouvement == "entree")
    total_depenses = decimal_sum(m.montant for m in mouvements if m.type_mouvement == "sortie")
    recettes_prevues = decimal_sum(ligne.montant_prevu for ligne in budget.lignes_budgetaires if ligne.type_ligne == "recette")
    depenses_prevues = decimal_sum(ligne.montant_prevu for ligne in budget.lignes_budgetaires if ligne.type_ligne == "depense")
    total_prevu = decimal_sum(ligne.montant_prevu for ligne in budget.lignes_budgetaires)

    budget.total_recettes_realisees = total_recettes
    budget.total_depenses_realisees = total_depenses
    budget.montant_total_prevu = total_prevu
    budget.montant_total_realise = total_depenses

    # ecart_total: difference between realised and planned result (recettes - depenses)
    recettes_realisees = Decimal(budget.total_recettes_realisees or 0)
    depenses_realisees = Decimal(budget.total_depenses_realisees or 0)
    solde_previsionnel = Decimal(recettes_prevues) - Decimal(depenses_prevues)
    solde_realise = recettes_realisees - depenses_realisees
    budget.ecart_total = solde_realise - solde_previsionnel
    if depenses_prevues > 0:
        budget.taux_execution_budgetaire = (total_depenses / depenses_prevues) * Decimal("100")
    else:
        budget.taux_execution_budgetaire = Decimal("0")

    if budget.projet is not None:
        budget.projet.budget_realise_total = total_depenses

    db.commit()
    db.refresh(budget)
    return budget


def _recalculate_after_change(db: Session, budget_id: int, ligne_ids: set[int | None]) -> None:
    for ligne_id in ligne_ids:
        _recalculate_ligne_from_mouvements(db, ligne_id)
    db.flush()
    recalculate_budget_realisations(db, budget_id)


def create_mouvement(db: Session, mouvement_in: MouvementFinancierCreate, current_user: User):
    _require_comptable(current_user)
    data = schema_to_dict(mouvement_in, exclude_unset=False)
    # validate mode_paiement if provided
    allowed_modes = {"Cash", "Mobile Money", "Banque"}
    if data.get("mode_paiement") is not None and data["mode_paiement"] not in allowed_modes:
        raise ValueError(f"mode_paiement invalide. Valeurs autorisees: {', '.join(allowed_modes)}")
    _validate_project_budget(db, data["projet_id"], data["budget_id"])
    # require and validate ligne_budgetaire for both entrees and sorties
    _validate_ligne_for_mouvement(db, data["type_mouvement"], data["budget_id"], data.get("ligne_budgetaire_id"))

    # generate reference_paiement if not provided
    if not data.get("reference_paiement"):
        while True:
            candidate = f"PAY-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{random.randint(1000,9999)}"
            exists = db.query(MouvementFinancier).filter(MouvementFinancier.reference_paiement == candidate).first()
            if exists is None:
                data["reference_paiement"] = candidate
                break

    mouvement = MouvementFinancier(**data, comptable_id=current_user.id)
    db.add(mouvement)
    db.commit()
    db.refresh(mouvement)
    _recalculate_after_change(db, mouvement.budget_id, {mouvement.ligne_budgetaire_id})
    db.refresh(mouvement)
    return mouvement


def create_entree(db: Session, mouvement_in: MouvementFinancierCreate, current_user: User):
    if mouvement_in.type_mouvement != "entree":
        raise ValueError("type_mouvement doit etre 'entree'")
    return create_mouvement(db, mouvement_in, current_user)


def create_sortie(db: Session, mouvement_in: MouvementFinancierCreate, current_user: User):
    if mouvement_in.type_mouvement != "sortie":
        raise ValueError("type_mouvement doit etre 'sortie'")
    return create_mouvement(db, mouvement_in, current_user)


def update_mouvement(db: Session, mouvement_id: int, mouvement_in: MouvementFinancierUpdate, current_user: User):
    _require_comptable(current_user)
    mouvement = get_mouvement_by_id(db, mouvement_id)
    if mouvement is None:
        return None
    old_ligne_id = mouvement.ligne_budgetaire_id
    _validate_project_budget(db, mouvement.projet_id, mouvement.budget_id)

    data = schema_to_dict(mouvement_in)
    ligne_id = data.get("ligne_budgetaire_id", mouvement.ligne_budgetaire_id)
    _validate_ligne_for_mouvement(db, mouvement.type_mouvement, mouvement.budget_id, ligne_id)

    update_model(mouvement, MouvementFinancierUpdate(**data))
    db.commit()
    db.refresh(mouvement)
    _recalculate_after_change(db, mouvement.budget_id, {old_ligne_id, mouvement.ligne_budgetaire_id})
    db.refresh(mouvement)
    return mouvement


def delete_mouvement(db: Session, mouvement_id: int, current_user: User):
    _require_comptable(current_user)
    mouvement = get_mouvement_by_id(db, mouvement_id)
    if mouvement is None:
        return None
    budget_id = mouvement.budget_id
    ligne_id = mouvement.ligne_budgetaire_id
    db.delete(mouvement)
    db.commit()
    _recalculate_after_change(db, budget_id, {ligne_id})
    return mouvement


def _percent(realise: Decimal, prevu: Decimal) -> Decimal:
    if prevu > 0:
        return (realise / prevu) * Decimal("100")
    return Decimal("0")


def _build_execution_payload(db: Session, budget: Budget):
    recalculate_budget_realisations(db, budget.id)
    db.refresh(budget)
    mouvements = get_mouvements(db, budget_id=budget.id, limit=10000)
    recettes_prevues = decimal_sum(
        ligne.montant_prevu for ligne in budget.lignes_budgetaires if ligne.type_ligne == "recette"
    )
    depenses_prevues = decimal_sum(
        ligne.montant_prevu for ligne in budget.lignes_budgetaires if ligne.type_ligne == "depense"
    )
    recettes_realisees = Decimal(budget.total_recettes_realisees or 0)
    depenses_realisees = Decimal(budget.total_depenses_realisees or 0)
    solde_previsionnel = recettes_prevues - depenses_prevues
    solde_realise = recettes_realisees - depenses_realisees
    lignes = [
        {
            "ligne_budgetaire_id": ligne.id,
            "libelle": ligne.libelle,
            "type_ligne": ligne.type_ligne,
            "montant_prevu": Decimal(ligne.montant_prevu or 0),
            "montant_realise": Decimal(ligne.montant_realise or 0),
            "ecart_montant": Decimal(ligne.ecart_montant or 0),
            "ecart_pourcentage": Decimal(ligne.ecart_pourcentage or 0),
        }
        for ligne in budget.lignes_budgetaires
    ]

    return {
        "projet_id": budget.projet_id,
        "budget_id": budget.id,
        "devise": budget.devise or "FC",
        "statut_budget": budget.statut,
        "budget_previsionnel": Decimal(budget.montant_total_prevu or 0),
        "total_prevu": Decimal(budget.montant_total_prevu or 0),
        "total_realise": depenses_realisees,
        "montant_realise_total": depenses_realisees,
        "total_recettes_prevues": recettes_prevues,
        "total_recettes_realisees": recettes_realisees,
        "total_depenses_prevues": depenses_prevues,
        "total_depenses_realisees": depenses_realisees,
        "solde_previsionnel": solde_previsionnel,
        "solde_realise": solde_realise,
        "ecart_recettes": recettes_realisees - recettes_prevues,
        "ecart_depenses": depenses_realisees - depenses_prevues,
        "ecart_resultat": solde_realise - solde_previsionnel,
        "ecart_total": Decimal(budget.ecart_total or 0),
        "taux_execution_budgetaire": Decimal(budget.taux_execution_budgetaire or 0),
        "taux_execution_depenses": _percent(depenses_realisees, depenses_prevues),
        "taux_execution_recettes": _percent(recettes_realisees, recettes_prevues),
        "lignes_budgetaires": lignes,
        "lignes": lignes,
        "mouvements_financiers": mouvements,
    }


def get_execution_budgetaire(db: Session, budget_id: int):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget is None:
        return None
    return _build_execution_payload(db, budget)


def get_execution_budgetaire_projet(db: Session, projet_id: int):
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if projet is None:
        return None
    if projet.budget is None:
        return {
            "projet_id": projet.id,
            "budget_id": None,
            "devise": "FC",
            "statut_budget": None,
            "budget_previsionnel": Decimal("0"),
            "total_prevu": Decimal("0"),
            "total_realise": Decimal("0"),
            "montant_realise_total": Decimal("0"),
            "total_recettes_prevues": Decimal("0"),
            "total_recettes_realisees": Decimal("0"),
            "total_depenses_prevues": Decimal("0"),
            "total_depenses_realisees": Decimal("0"),
            "solde_previsionnel": Decimal("0"),
            "solde_realise": Decimal("0"),
            "ecart_recettes": Decimal("0"),
            "ecart_depenses": Decimal("0"),
            "ecart_resultat": Decimal("0"),
            "ecart_total": Decimal("0"),
            "taux_execution_budgetaire": Decimal("0"),
            "taux_execution_depenses": Decimal("0"),
            "taux_execution_recettes": Decimal("0"),
            "lignes_budgetaires": [],
            "lignes": [],
            "mouvements_financiers": [],
        }
    return _build_execution_payload(db, projet.budget)


def get_synthese_financiere_projet(db: Session, projet_id: int):
    return get_execution_budgetaire_projet(db, projet_id)


def get_analyse_ecarts_budget(db: Session, budget_id: int):
    return get_execution_budgetaire(db, budget_id)
