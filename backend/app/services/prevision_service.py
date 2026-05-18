from sqlalchemy.orm import Session

from app.models.ligne_budgetaire import LigneBudgetaire
from app.models.prevision import Prevision
from app.schemas.prevision import PrevisionCreate, PrevisionUpdate
from app.services._utils import decimal_sum, schema_to_dict, update_model, validate_non_negative


def get_prevision_by_id(db: Session, prevision_id: int):
    return db.query(Prevision).filter(Prevision.id == prevision_id).first()


def get_by_id(db: Session, id: int):
    return get_prevision_by_id(db, id)


def get_previsions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Prevision).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_previsions(db, skip, limit)


def get_previsions_by_ligne(db: Session, ligne_budgetaire_id: int):
    return db.query(Prevision).filter(Prevision.ligne_budgetaire_id == ligne_budgetaire_id).all()


def _recalculate_ligne_previsions(db: Session, ligne_budgetaire_id: int):
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.id == ligne_budgetaire_id).first()
    if ligne is None:
        return None
    # Somme des previsions lorsque plusieurs previsions alimentent une ligne.
    ligne.montant_prevu = decimal_sum(prevision.montant_prevu for prevision in ligne.previsions)
    db.commit()
    db.refresh(ligne)
    from app.services.ligne_budgetaire_service import recalculate_ligne

    return recalculate_ligne(db, ligne.id)


def create_prevision(db: Session, prevision_in: PrevisionCreate):
    data = schema_to_dict(prevision_in, exclude_unset=False)
    validate_non_negative(data.get("montant_prevu"), "montant_prevu")
    prevision = Prevision(**data)
    db.add(prevision)
    db.commit()
    db.refresh(prevision)
    _recalculate_ligne_previsions(db, prevision.ligne_budgetaire_id)
    return prevision


def create(db: Session, obj_in: PrevisionCreate):
    return create_prevision(db, obj_in)


def update_prevision(db: Session, prevision_id: int, prevision_in: PrevisionUpdate):
    prevision = get_prevision_by_id(db, prevision_id)
    if prevision is None:
        return None
    old_ligne_id = prevision.ligne_budgetaire_id
    data = schema_to_dict(prevision_in)
    validate_non_negative(data.get("montant_prevu"), "montant_prevu")
    update_model(prevision, prevision_in)
    db.commit()
    db.refresh(prevision)
    _recalculate_ligne_previsions(db, old_ligne_id)
    if old_ligne_id != prevision.ligne_budgetaire_id:
        _recalculate_ligne_previsions(db, prevision.ligne_budgetaire_id)
    return prevision


def update(db: Session, db_obj, obj_in: PrevisionUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_prevision(db: Session, prevision_id: int):
    prevision = get_prevision_by_id(db, prevision_id)
    if prevision is None:
        return None
    ligne_id = prevision.ligne_budgetaire_id
    db.delete(prevision)
    db.commit()
    _recalculate_ligne_previsions(db, ligne_id)
    return prevision


def delete(db: Session, id: int):
    return delete_prevision(db, id)
