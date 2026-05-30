from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.exercice_budgetaire import ExerciceBudgetaire
from app.models.projet import Projet
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.services._utils import decimal_sum, require_unique, schema_to_dict, update_model

VALID_STATUTS = {
    "brouillon",
    "soumis",
    "soumis_gestionnaire",
    "valide",
    "valide_gestionnaire",
    "soumis_admin",
    "approuve_admin",
    "en_execution",
    "execute",
    "cloture",
    "rejete",
    "rejete_gestionnaire",
    "rejete_admin",
}
ROLE_CHEF_PROJET = "chef de projet"
ROLE_GESTIONNAIRE = "gestionnaire"
ROLE_ADMIN = "administrateur"
STATUS_EXERCICE_OUVERT = "ouvert"
FINAL_STATUSES = {"execute", "cloture"}


def _has_role(user: User | None, role_name: str) -> bool:
    if user is None:
        return False
    return any((role.nom_role or "").strip().lower() == role_name for role in user.roles)


def _is_gestionnaire(user: User | None) -> bool:
    if user is None:
        return False
    return any(ROLE_GESTIONNAIRE in (role.nom_role or "").strip().lower() for role in user.roles)


def _is_admin(user: User | None) -> bool:
    if user is None:
        return False
    return any((role.nom_role or "").strip().lower() == ROLE_ADMIN for role in user.roles)


def _require_admin(user: User | None) -> None:
    if not _is_admin(user):
        raise PermissionError("Seul l'Administrateur peut effectuer cette action sur l'execution du budget.")


def _require_gestionnaire(user: User | None) -> None:
    if not _is_gestionnaire(user):
        raise PermissionError("Seul le Gestionnaire peut valider un budget avant soumission a l'Administrateur.")


def _get_active_exercice(db: Session):
    return db.query(ExerciceBudgetaire).filter(ExerciceBudgetaire.statut == STATUS_EXERCICE_OUVERT).first()


def get_budget_by_id(db: Session, budget_id: int):
    return db.query(Budget).filter(Budget.id == budget_id).first()


def get_by_id(db: Session, id: int):
    return get_budget_by_id(db, id)


def get_budget_by_reference(db: Session, reference: str):
    return db.query(Budget).filter(Budget.reference == reference).first()


def get_budgets(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Budget).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_budgets(db, skip, limit)


def get_budgets_by_departement(db: Session, departement_id: int):
    return db.query(Budget).filter(Budget.departement_id == departement_id).all()


def get_budgets_by_exercice(db: Session, exercice_id: int):
    return db.query(Budget).filter(Budget.exercice_id == exercice_id).all()


def get_budgets_by_statut(db: Session, statut: str):
    return db.query(Budget).filter(Budget.statut == statut).all()


def get_budgets_by_projet(db: Session, projet_id: int):
    return db.query(Budget).filter(Budget.projet_id == projet_id).all()


def create_budget(db: Session, budget_in: BudgetCreate, current_user: User | None):
    if not _has_role(current_user, ROLE_CHEF_PROJET):
        if _is_gestionnaire(current_user):
            raise PermissionError("Le Gestionnaire ne peut pas creer de budget. Seul le Chef de projet peut creer le budget de son projet.")
        raise PermissionError("Seul un utilisateur ayant le role 'Chef de projet' peut creer un budget.")
    if current_user is None:
        raise PermissionError("Authentification requise pour creer un budget.")
    data = schema_to_dict(budget_in, exclude_unset=False)
    require_unique(get_budget_by_reference(db, data["reference"]), "Un budget avec cette reference existe deja")

    active_exercice = _get_active_exercice(db)
    if active_exercice is None:
        raise ValueError("Aucun exercice budgetaire ouvert. Impossible de creer un budget.")

    projet_id = data["projet_id"]
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if projet is None:
        raise ValueError("Projet introuvable")
    if projet.chef_projet_id != current_user.id:
        raise PermissionError("Vous ne pouvez creer un budget que pour l'un de vos projets.")
    if projet.exercice_id != active_exercice.id:
        raise ValueError("Le projet choisi n'appartient pas a l'exercice budgetaire ouvert.")

    existing = (
        db.query(Budget)
        .filter(Budget.projet_id == projet.id, Budget.exercice_id == active_exercice.id)
        .first()
    )
    if existing is not None:
        raise ValueError("Un budget existe deja pour ce projet dans l'exercice budgetaire ouvert.")

    budget = Budget(
        reference=data["reference"],
        libelle=data["libelle"],
        description=data.get("description"),
        statut="brouillon",
        montant_total_prevu=Decimal("0"),
        montant_total_realise=Decimal("0"),
        ecart_total=Decimal("0"),
        projet_id=projet.id,
        exercice_id=active_exercice.id,
        created_by_id=current_user.id,
        departement_id=projet.departement_id,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def create(db: Session, obj_in: BudgetCreate):
    return create_budget(db, obj_in, current_user=None)


def update_budget(db: Session, budget_id: int, budget_in: BudgetUpdate):
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        return None
    if budget.statut in FINAL_STATUSES:
        raise ValueError("Un budget execute ou cloture ne peut plus etre modifie librement.")
    data = schema_to_dict(budget_in)
    if "reference" in data:
        existing = get_budget_by_reference(db, data["reference"])
        if existing is not None and existing.id != budget_id:
            raise ValueError("Un budget avec cette reference existe deja")
    if "statut" in data and data["statut"] not in VALID_STATUTS:
        raise ValueError("Statut de budget invalide")
    if "projet_id" in data and data["projet_id"] is not None:
        projet = db.query(Projet).filter(Projet.id == data["projet_id"]).first()
        if projet is None:
            raise ValueError("Projet introuvable")
        if "departement_id" in data and data["departement_id"] is not None and projet.departement_id != data["departement_id"]:
            raise ValueError("Le departement du budget doit correspondre au departement du projet")
        if "exercice_id" in data and data["exercice_id"] is not None and projet.exercice_id != data["exercice_id"]:
            raise ValueError("L'exercice du budget doit correspondre a l'exercice du projet")
        existing = db.query(Budget).filter(Budget.projet_id == data["projet_id"], Budget.id != budget_id).first()
        if existing is not None:
            raise ValueError("Un budget existe deja pour ce projet")
    update_model(budget, budget_in)
    db.commit()
    db.refresh(budget)
    return budget


def update(db: Session, db_obj, obj_in: BudgetUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_budget(db: Session, budget_id: int):
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        return None
    if budget.statut in FINAL_STATUSES:
        raise ValueError("Un budget execute ou cloture ne peut plus etre supprime librement.")
    db.delete(budget)
    db.commit()
    return budget


def delete(db: Session, id: int):
    return delete_budget(db, id)


def _transition_budget(db: Session, budget_id: int, allowed: set[str], target: str):
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        return None
    if budget.statut not in allowed:
        raise ValueError(f"Transition de statut invalide: {budget.statut} vers {target}")
    budget.statut = target
    db.commit()
    db.refresh(budget)
    return budget


def submit_budget(db: Session, budget_id: int):
    return _transition_budget(db, budget_id, {"brouillon"}, "soumis_gestionnaire")


def validate_by_gestionnaire(db: Session, budget_id: int, current_user: User | None):
    _require_gestionnaire(current_user)
    return _transition_budget(db, budget_id, {"soumis", "soumis_gestionnaire"}, "valide_gestionnaire")


def reject_by_gestionnaire(db: Session, budget_id: int, current_user: User | None):
    _require_gestionnaire(current_user)
    return _transition_budget(db, budget_id, {"soumis", "soumis_gestionnaire"}, "rejete_gestionnaire")


def submit_to_admin(db: Session, budget_id: int, current_user: User | None):
    _require_gestionnaire(current_user)
    return _transition_budget(db, budget_id, {"valide_gestionnaire"}, "soumis_admin")


def approve_budget(db: Session, budget_id: int, current_user: User | None = None):
    if current_user is not None:
        _require_admin(current_user)
    return _transition_budget(
        db,
        budget_id,
        {"soumis", "valide", "soumis_admin"},
        "approuve_admin",
    )


def reject_budget(db: Session, budget_id: int):
    return _transition_budget(db, budget_id, {"soumis", "soumis_gestionnaire", "soumis_admin"}, "rejete_admin")


def close_budget(db: Session, budget_id: int):
    return _transition_budget(db, budget_id, {"approuve_admin", "valide", "en_execution"}, "cloture")


def start_execution(db: Session, budget_id: int, current_user: User | None):
    _require_admin(current_user)
    return _transition_budget(db, budget_id, {"approuve_admin", "valide"}, "en_execution")


def close_execution(db: Session, budget_id: int, current_user: User | None):
    _require_admin(current_user)
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        return None
    if budget.statut != "en_execution":
        raise ValueError("Seul un budget en execution peut etre cloture.")
    recalculate_budget_totals(db, budget_id)
    budget = get_budget_by_id(db, budget_id)
    budget.statut = "execute"
    db.commit()
    db.refresh(budget)
    return budget


def recalculate_budget_totals(db: Session, budget_id: int):
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        return None
    # L'execution budgetaire est calculee depuis les mouvements financiers comptables.
    from app.models.mouvement_financier import MouvementFinancier

    mouvements = db.query(MouvementFinancier).filter(MouvementFinancier.budget_id == budget_id).all()
    for ligne in budget.lignes_budgetaires:
        if ligne.type_ligne == "depense":
            ligne.montant_realise = decimal_sum(
                mouvement.montant
                for mouvement in mouvements
                if mouvement.type_mouvement == "sortie" and mouvement.ligne_budgetaire_id == ligne.id
            )
        else:
            ligne.montant_realise = Decimal("0")
        ligne.ecart_montant = Decimal(ligne.montant_realise or 0) - Decimal(ligne.montant_prevu or 0)
        if Decimal(ligne.montant_prevu or 0) > 0:
            ligne.ecart_pourcentage = (ligne.ecart_montant / Decimal(ligne.montant_prevu)) * Decimal("100")
        else:
            ligne.ecart_pourcentage = Decimal("0")

    total_recettes = decimal_sum(mouvement.montant for mouvement in mouvements if mouvement.type_mouvement == "entree")
    total_depenses = decimal_sum(mouvement.montant for mouvement in mouvements if mouvement.type_mouvement == "sortie")
    total_depenses_prevues = decimal_sum(
        ligne.montant_prevu for ligne in budget.lignes_budgetaires if ligne.type_ligne == "depense"
    )
    budget.montant_total_prevu = decimal_sum(ligne.montant_prevu for ligne in budget.lignes_budgetaires)
    budget.total_recettes_realisees = total_recettes
    budget.total_depenses_realisees = total_depenses
    budget.montant_total_realise = total_depenses
    budget.ecart_total = total_depenses - total_depenses_prevues
    if total_depenses_prevues > 0:
        budget.taux_execution_budgetaire = (total_depenses / total_depenses_prevues) * Decimal("100")
    else:
        budget.taux_execution_budgetaire = Decimal("0")
    if budget.projet is not None:
        budget.projet.budget_realise_total = total_depenses
    db.commit()
    db.refresh(budget)
    return budget
