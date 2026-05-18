from sqlalchemy.orm import Session

from app.models.departement import Departement
from app.schemas.departement import DepartementCreate, DepartementUpdate
from app.services._utils import require_unique, schema_to_dict, update_model


def get_departement_by_id(db: Session, departement_id: int):
    return db.query(Departement).filter(Departement.id == departement_id).first()


def get_by_id(db: Session, id: int):
    return get_departement_by_id(db, id)


def get_departement_by_name(db: Session, nom: str):
    return db.query(Departement).filter(Departement.nom == nom).first()


def get_departements(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Departement).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_departements(db, skip, limit)


def create_departement(db: Session, departement_in: DepartementCreate):
    require_unique(get_departement_by_name(db, departement_in.nom), "Un departement avec ce nom existe deja")
    departement = Departement(**schema_to_dict(departement_in, exclude_unset=False))
    db.add(departement)
    db.commit()
    db.refresh(departement)
    return departement


def create(db: Session, obj_in: DepartementCreate):
    return create_departement(db, obj_in)


def update_departement(db: Session, departement_id: int, departement_in: DepartementUpdate):
    departement = get_departement_by_id(db, departement_id)
    if departement is None:
        return None
    data = schema_to_dict(departement_in)
    if "nom" in data:
        existing = get_departement_by_name(db, data["nom"])
        if existing is not None and existing.id != departement_id:
            raise ValueError("Un departement avec ce nom existe deja")
    update_model(departement, departement_in)
    db.commit()
    db.refresh(departement)
    return departement


def update(db: Session, db_obj, obj_in: DepartementUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_departement(db: Session, departement_id: int):
    departement = get_departement_by_id(db, departement_id)
    if departement is None:
        return None
    if departement.budgets:
        departement.statut = "inactif"
        db.commit()
        db.refresh(departement)
        return departement
    db.delete(departement)
    db.commit()
    return departement


def delete(db: Session, id: int):
    return delete_departement(db, id)


def activate_departement(db: Session, departement_id: int):
    departement = get_departement_by_id(db, departement_id)
    if departement is None:
        return None
    departement.statut = "actif"
    db.commit()
    db.refresh(departement)
    return departement


def deactivate_departement(db: Session, departement_id: int):
    departement = get_departement_by_id(db, departement_id)
    if departement is None:
        return None
    departement.statut = "inactif"
    db.commit()
    db.refresh(departement)
    return departement
