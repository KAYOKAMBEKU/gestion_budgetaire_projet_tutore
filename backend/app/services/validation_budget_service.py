from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.validation_budget import ValidationBudget
from app.schemas.validation_budget import ValidationBudgetCreate, ValidationBudgetUpdate
from app.services._utils import schema_to_dict
from app.services._utils import update_model


def get_validation_by_id(db: Session, validation_id: int):
    return db.query(ValidationBudget).filter(ValidationBudget.id == validation_id).first()


def get_by_id(db: Session, id: int):
    return get_validation_by_id(db, id)


def get_validations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ValidationBudget).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_validations(db, skip, limit)


def get_validations_by_budget(db: Session, budget_id: int):
    return db.query(ValidationBudget).filter(ValidationBudget.budget_id == budget_id).all()


def get_validations_by_user(db: Session, utilisateur_id: int):
    return db.query(ValidationBudget).filter(ValidationBudget.utilisateur_id == utilisateur_id).all()


def create_validation(db: Session, validation_in: ValidationBudgetCreate):
    validation = ValidationBudget(**schema_to_dict(validation_in, exclude_unset=False))
    db.add(validation)
    db.commit()
    db.refresh(validation)
    return validation


def create(db: Session, obj_in: ValidationBudgetCreate):
    return create_validation(db, obj_in)


def update_validation(db: Session, validation_id: int, validation_in: ValidationBudgetUpdate):
    validation = get_validation_by_id(db, validation_id)
    if validation is None:
        return None
    update_model(validation, validation_in)
    db.commit()
    db.refresh(validation)
    return validation


def update(db: Session, db_obj, obj_in: ValidationBudgetUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_validation(db: Session, validation_id: int):
    validation = get_validation_by_id(db, validation_id)
    if validation is None:
        return None
    db.delete(validation)
    db.commit()
    return validation


def delete(db: Session, id: int):
    return delete_validation(db, id)


def _create_budget_validation(db: Session, budget_id: int, utilisateur_id: int, statut: str, commentaire: str | None = None):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget is None:
        return None
    validation = ValidationBudget(
        statut_validation=statut,
        commentaire=commentaire,
        budget_id=budget_id,
        utilisateur_id=utilisateur_id,
    )
    budget.statut = statut
    db.add(validation)
    db.commit()
    db.refresh(validation)
    return validation


def validate_budget(db: Session, budget_id: int, utilisateur_id: int, commentaire: str | None = None):
    return _create_budget_validation(db, budget_id, utilisateur_id, "valide", commentaire)


def reject_budget(db: Session, budget_id: int, utilisateur_id: int, commentaire: str | None = None):
    return _create_budget_validation(db, budget_id, utilisateur_id, "rejete", commentaire)
