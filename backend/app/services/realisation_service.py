from sqlalchemy.orm import Session

from app.models.realisation import Realisation
from app.schemas.realisation import RealisationCreate, RealisationUpdate
from app.services._utils import schema_to_dict, update_model, validate_non_negative

VALID_STATUTS = {"en_attente", "validee", "rejetee", "annulee"}


def get_realisation_by_id(db: Session, realisation_id: int):
    return db.query(Realisation).filter(Realisation.id == realisation_id).first()


def get_by_id(db: Session, id: int):
    return get_realisation_by_id(db, id)


def get_realisations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Realisation).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_realisations(db, skip, limit)


def get_realisations_by_ligne(db: Session, ligne_budgetaire_id: int):
    return db.query(Realisation).filter(Realisation.ligne_budgetaire_id == ligne_budgetaire_id).all()


def get_realisations_by_statut(db: Session, statut: str):
    return db.query(Realisation).filter(Realisation.statut == statut).all()


def _recalculate_after_realisation_change(db: Session, ligne_budgetaire_id: int):
    from app.services.ligne_budgetaire_service import recalculate_ligne

    return recalculate_ligne(db, ligne_budgetaire_id)


def create_realisation(db: Session, realisation_in: RealisationCreate):
    data = schema_to_dict(realisation_in, exclude_unset=False)
    validate_non_negative(data.get("montant_realise"), "montant_realise")
    data["statut"] = data.get("statut") or "en_attente"
    if data["statut"] not in VALID_STATUTS:
        raise ValueError("Statut de realisation invalide")
    realisation = Realisation(**data)
    db.add(realisation)
    db.commit()
    db.refresh(realisation)
    _recalculate_after_realisation_change(db, realisation.ligne_budgetaire_id)
    return realisation


def create(db: Session, obj_in: RealisationCreate):
    return create_realisation(db, obj_in)


def update_realisation(db: Session, realisation_id: int, realisation_in: RealisationUpdate):
    realisation = get_realisation_by_id(db, realisation_id)
    if realisation is None:
        return None
    old_ligne_id = realisation.ligne_budgetaire_id
    data = schema_to_dict(realisation_in)
    validate_non_negative(data.get("montant_realise"), "montant_realise")
    if "statut" in data and data["statut"] not in VALID_STATUTS:
        raise ValueError("Statut de realisation invalide")
    update_model(realisation, realisation_in)
    db.commit()
    db.refresh(realisation)
    _recalculate_after_realisation_change(db, old_ligne_id)
    if old_ligne_id != realisation.ligne_budgetaire_id:
        _recalculate_after_realisation_change(db, realisation.ligne_budgetaire_id)
    return realisation


def update(db: Session, db_obj, obj_in: RealisationUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_realisation(db: Session, realisation_id: int):
    realisation = get_realisation_by_id(db, realisation_id)
    if realisation is None:
        return None
    ligne_id = realisation.ligne_budgetaire_id
    db.delete(realisation)
    db.commit()
    _recalculate_after_realisation_change(db, ligne_id)
    return realisation


def delete(db: Session, id: int):
    return delete_realisation(db, id)


def _set_realisation_statut(db: Session, realisation_id: int, statut: str):
    realisation = get_realisation_by_id(db, realisation_id)
    if realisation is None:
        return None
    realisation.statut = statut
    db.commit()
    db.refresh(realisation)
    # Validation/rejet/annulation declenchent les recalculs ligne, ecart et budget.
    _recalculate_after_realisation_change(db, realisation.ligne_budgetaire_id)
    return realisation


def validate_realisation(db: Session, realisation_id: int):
    return _set_realisation_statut(db, realisation_id, "validee")


def reject_realisation(db: Session, realisation_id: int):
    return _set_realisation_statut(db, realisation_id, "rejetee")


def cancel_realisation(db: Session, realisation_id: int):
    return _set_realisation_statut(db, realisation_id, "annulee")
