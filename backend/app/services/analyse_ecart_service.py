from sqlalchemy.orm import Session

from app.models.analyse_ecart import AnalyseEcart
from app.schemas.analyse_ecart import AnalyseEcartCreate, AnalyseEcartUpdate
from app.services._utils import schema_to_dict, update_model


def get_analyse_by_id(db: Session, analyse_id: int):
    return db.query(AnalyseEcart).filter(AnalyseEcart.id == analyse_id).first()


def get_by_id(db: Session, id: int):
    return get_analyse_by_id(db, id)


def get_analyse_by_ecart(db: Session, ecart_id: int):
    return db.query(AnalyseEcart).filter(AnalyseEcart.ecart_id == ecart_id).first()


def get_analyses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AnalyseEcart).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_analyses(db, skip, limit)


def create_analyse(db: Session, analyse_in: AnalyseEcartCreate):
    data = schema_to_dict(analyse_in, exclude_unset=False)
    if get_analyse_by_ecart(db, data["ecart_id"]) is not None:
        raise ValueError("Une analyse existe deja pour cet ecart")
    analyse = AnalyseEcart(**data)
    db.add(analyse)
    db.commit()
    db.refresh(analyse)
    return analyse


def create(db: Session, obj_in: AnalyseEcartCreate):
    return create_analyse(db, obj_in)


def update_analyse(db: Session, analyse_id: int, analyse_in: AnalyseEcartUpdate):
    analyse = get_analyse_by_id(db, analyse_id)
    if analyse is None:
        return None
    data = schema_to_dict(analyse_in)
    if "ecart_id" in data:
        existing = get_analyse_by_ecart(db, data["ecart_id"])
        if existing is not None and existing.id != analyse_id:
            raise ValueError("Une analyse existe deja pour cet ecart")
    update_model(analyse, analyse_in)
    db.commit()
    db.refresh(analyse)
    return analyse


def update(db: Session, db_obj, obj_in: AnalyseEcartUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_analyse(db: Session, analyse_id: int):
    analyse = get_analyse_by_id(db, analyse_id)
    if analyse is None:
        return None
    db.delete(analyse)
    db.commit()
    return analyse


def delete(db: Session, id: int):
    return delete_analyse(db, id)
