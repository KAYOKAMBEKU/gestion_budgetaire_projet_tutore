from sqlalchemy.orm import Session

from app.models.departement import Departement
from app.models.user import User
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
    data = schema_to_dict(departement_in, exclude_unset=False)
    gestionnaire_id = data.pop("gestionnaire_id", None)
    departement = Departement(**data)
    db.add(departement)
    db.commit()
    db.refresh(departement)
    if gestionnaire_id is not None:
        assign_gestionnaire_to_departement(db, departement.id, gestionnaire_id)
    return departement


def create(db: Session, obj_in: DepartementCreate):
    return create_departement(db, obj_in)


def update_departement(db: Session, departement_id: int, departement_in: DepartementUpdate):
    departement = get_departement_by_id(db, departement_id)
    if departement is None:
        return None
    data = schema_to_dict(departement_in)
    gestionnaire_id = data.pop("gestionnaire_id", None)
    if "nom" in data:
        existing = get_departement_by_name(db, data["nom"])
        if existing is not None and existing.id != departement_id:
            raise ValueError("Un departement avec ce nom existe deja")
    update_model(departement, departement_in)
    db.commit()
    db.refresh(departement)
    if gestionnaire_id is not None:
        assign_gestionnaire_to_departement(db, departement_id, gestionnaire_id)
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


def get_gestionnaires_by_departement(db: Session, departement_id: int):
    return db.query(User).filter(User.departement_id == departement_id).all()


def get_available_gestionnaires(db: Session, departement_id: int | None = None):
    query = db.query(User)
    if departement_id is not None:
        query = query.filter((User.departement_id.is_(None)) | (User.departement_id == departement_id))
    else:
        query = query.filter(User.departement_id.is_(None))
    candidates = query.all()
    return [user for user in candidates if _has_manager_role(user)]


def _has_manager_role(user: User) -> bool:
    if user is None:
        return False
    for role in user.roles:
        name = (role.nom_role or "").lower()
        if "gestionnaire" in name or "manager" in name or "budget manager" in name:
            return True
    return False


def assign_gestionnaire_to_departement(db: Session, departement_id: int, user_id: int):
    departement = get_departement_by_id(db, departement_id)
    if departement is None:
        raise ValueError("Departement introuvable")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise ValueError("Utilisateur introuvable")
    if not _has_manager_role(user):
        raise ValueError("This user does not have the manager role.")
    if user.departement_id is not None and user.departement_id != departement_id:
        raise ValueError("Ce gestionnaire est deja affecte a un autre departement")
    user.departement_id = departement_id
    departement.responsable = f"{user.nom} {user.prenom or ''}".strip()
    db.commit()
    db.refresh(user)
    return user


def remove_gestionnaire_from_departement(db: Session, departement_id: int, user_id: int):
    departement = get_departement_by_id(db, departement_id)
    if departement is None:
        raise ValueError("Departement introuvable")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise ValueError("Utilisateur introuvable")
    if user.departement_id != departement_id:
        raise ValueError("Ce gestionnaire n'est pas affecte a ce departement")
    user.departement_id = None
    db.commit()
    db.refresh(user)
    return user


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
