from sqlalchemy.orm import Session

from app.models.categorie_budgetaire import CategorieBudgetaire
from app.schemas.categorie_budgetaire import CategorieBudgetaireCreate, CategorieBudgetaireUpdate
from app.services._utils import require_unique, schema_to_dict, update_model

VALID_TYPES = {"recette", "depense"}


def _validate_type(type_categorie: str | None) -> None:
    if type_categorie is not None and type_categorie not in VALID_TYPES:
        raise ValueError("type_categorie doit etre 'recette' ou 'depense'")


def get_categorie_by_id(db: Session, categorie_id: int):
    return db.query(CategorieBudgetaire).filter(CategorieBudgetaire.id == categorie_id).first()


def get_by_id(db: Session, id: int):
    return get_categorie_by_id(db, id)


def get_categorie_by_name(db: Session, nom: str):
    return db.query(CategorieBudgetaire).filter(CategorieBudgetaire.nom == nom).first()


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(CategorieBudgetaire).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_categories(db, skip, limit)


def get_categories_by_type(db: Session, type_categorie: str):
    _validate_type(type_categorie)
    return db.query(CategorieBudgetaire).filter(CategorieBudgetaire.type_categorie == type_categorie).all()


def create_categorie(db: Session, categorie_in: CategorieBudgetaireCreate):
    data = schema_to_dict(categorie_in, exclude_unset=False)
    _validate_type(data.get("type_categorie"))
    require_unique(get_categorie_by_name(db, data["nom"]), "Une categorie avec ce nom existe deja")
    categorie = CategorieBudgetaire(**data)
    db.add(categorie)
    db.commit()
    db.refresh(categorie)
    return categorie


def create(db: Session, obj_in: CategorieBudgetaireCreate):
    return create_categorie(db, obj_in)


def update_categorie(db: Session, categorie_id: int, categorie_in: CategorieBudgetaireUpdate):
    categorie = get_categorie_by_id(db, categorie_id)
    if categorie is None:
        return None
    data = schema_to_dict(categorie_in)
    _validate_type(data.get("type_categorie"))
    if "nom" in data:
        existing = get_categorie_by_name(db, data["nom"])
        if existing is not None and existing.id != categorie_id:
            raise ValueError("Une categorie avec ce nom existe deja")
    update_model(categorie, categorie_in)
    db.commit()
    db.refresh(categorie)
    return categorie


def update(db: Session, db_obj, obj_in: CategorieBudgetaireUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_categorie(db: Session, categorie_id: int):
    categorie = get_categorie_by_id(db, categorie_id)
    if categorie is None:
        return None
    db.delete(categorie)
    db.commit()
    return categorie


def delete(db: Session, id: int):
    return delete_categorie(db, id)
