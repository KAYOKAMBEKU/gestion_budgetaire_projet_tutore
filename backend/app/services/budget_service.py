from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.projet import Projet
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.services._utils import decimal_sum, require_unique, schema_to_dict, update_model

VALID_STATUTS = {"brouillon", "soumis", "valide", "rejete", "en_execution", "cloture"}


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


def create_budget(db: Session, budget_in: BudgetCreate):
    data = schema_to_dict(budget_in, exclude_unset=False)
    require_unique(get_budget_by_reference(db, data["reference"]), "Un budget avec cette reference existe deja")
    data["montant_total_prevu"] = Decimal("0")
    data["montant_total_realise"] = Decimal("0")
    data["ecart_total"] = Decimal("0")

    projet_id = data.get("projet_id")
    if projet_id is not None:
        projet = db.query(Projet).filter(Projet.id == projet_id).first()
        if projet is None:
            raise ValueError("Projet introuvable")
        if projet.departement_id != data["departement_id"]:
            raise ValueError("Le departement du budget doit correspondre au departement du projet")
        if projet.exercice_id != data["exercice_id"]:
            raise ValueError("L'exercice du budget doit correspondre a l'exercice du projet")
        existing = db.query(Budget).filter(Budget.projet_id == projet_id).first()
        if existing is not None:
            raise ValueError("Un budget existe deja pour ce projet")

    budget = Budget(**data)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def create(db: Session, obj_in: BudgetCreate):
    return create_budget(db, obj_in)


def update_budget(db: Session, budget_id: int, budget_in: BudgetUpdate):
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        return None
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
    return _transition_budget(db, budget_id, {"brouillon"}, "soumis")


def approve_budget(db: Session, budget_id: int):
    return _transition_budget(db, budget_id, {"soumis"}, "valide")


def reject_budget(db: Session, budget_id: int):
    return _transition_budget(db, budget_id, {"soumis"}, "rejete")


def close_budget(db: Session, budget_id: int):
    return _transition_budget(db, budget_id, {"valide", "en_execution"}, "cloture")


def recalculate_budget_totals(db: Session, budget_id: int):
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        return None
    # Recalcul des totaux depuis les lignes budgetaires.
    budget.montant_total_prevu = decimal_sum(ligne.montant_prevu for ligne in budget.lignes_budgetaires)
    budget.montant_total_realise = decimal_sum(ligne.montant_realise for ligne in budget.lignes_budgetaires)
    budget.ecart_total = budget.montant_total_realise - budget.montant_total_prevu
    db.commit()
    db.refresh(budget)
    return budget
