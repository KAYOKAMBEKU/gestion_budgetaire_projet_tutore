from sqlalchemy.orm import Session

from app.models.exercice_budgetaire import ExerciceBudgetaire
from app.schemas.exercice_budgetaire import ExerciceBudgetaireCreate, ExerciceBudgetaireUpdate
from app.services._utils import require_unique, schema_to_dict, update_model


def _validate_dates(date_debut, date_fin) -> None:
    if date_debut is not None and date_fin is not None and date_fin <= date_debut:
        raise ValueError("date_fin doit etre superieure a date_debut")


def get_exercice_by_id(db: Session, exercice_id: int):
    return db.query(ExerciceBudgetaire).filter(ExerciceBudgetaire.id == exercice_id).first()


def get_by_id(db: Session, id: int):
    return get_exercice_by_id(db, id)


def get_exercice_by_libelle(db: Session, libelle: str):
    return db.query(ExerciceBudgetaire).filter(ExerciceBudgetaire.libelle == libelle).first()


def get_exercices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ExerciceBudgetaire).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_exercices(db, skip, limit)


def get_active_exercice(db: Session):
    return db.query(ExerciceBudgetaire).filter(ExerciceBudgetaire.statut == "ouvert").first()


def create_exercice(db: Session, exercice_in: ExerciceBudgetaireCreate):
    data = schema_to_dict(exercice_in, exclude_unset=False)
    _validate_dates(data.get("date_debut"), data.get("date_fin"))
    require_unique(get_exercice_by_libelle(db, data["libelle"]), "Un exercice avec ce libelle existe deja")
    exercice = ExerciceBudgetaire(**data)
    db.add(exercice)
    db.commit()
    db.refresh(exercice)
    return exercice


def create(db: Session, obj_in: ExerciceBudgetaireCreate):
    return create_exercice(db, obj_in)


def update_exercice(db: Session, exercice_id: int, exercice_in: ExerciceBudgetaireUpdate):
    exercice = get_exercice_by_id(db, exercice_id)
    if exercice is None:
        return None
    if exercice.statut == "cloture":
        raise ValueError("Un exercice cloture ne peut pas etre modifie")
    data = schema_to_dict(exercice_in)
    date_debut = data.get("date_debut", exercice.date_debut)
    date_fin = data.get("date_fin", exercice.date_fin)
    _validate_dates(date_debut, date_fin)
    if "libelle" in data:
        existing = get_exercice_by_libelle(db, data["libelle"])
        if existing is not None and existing.id != exercice_id:
            raise ValueError("Un exercice avec ce libelle existe deja")
    update_model(exercice, exercice_in)
    db.commit()
    db.refresh(exercice)
    return exercice


def update(db: Session, db_obj, obj_in: ExerciceBudgetaireUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_exercice(db: Session, exercice_id: int):
    exercice = get_exercice_by_id(db, exercice_id)
    if exercice is None:
        return None
    db.delete(exercice)
    db.commit()
    return exercice


def delete(db: Session, id: int):
    return delete_exercice(db, id)


def open_exercice(db: Session, exercice_id: int):
    exercice = get_exercice_by_id(db, exercice_id)
    if exercice is None:
        return None
    for opened in db.query(ExerciceBudgetaire).filter(ExerciceBudgetaire.statut == "ouvert").all():
        opened.statut = "cloture"
    exercice.statut = "ouvert"
    db.commit()
    db.refresh(exercice)
    return exercice


def close_exercice(db: Session, exercice_id: int):
    exercice = get_exercice_by_id(db, exercice_id)
    if exercice is None:
        return None
    exercice.statut = "cloture"
    db.commit()
    db.refresh(exercice)
    return exercice
