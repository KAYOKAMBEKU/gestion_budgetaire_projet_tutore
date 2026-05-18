from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.security.password import hash_password
from app.services._utils import require_unique, schema_to_dict, update_model


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_by_id(db: Session, id: int):
    return get_user_by_id(db, id)


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_users(db, skip, limit)


def assign_roles_to_user(db: Session, user_id: int, role_ids: list[int]):
    user = get_user_by_id(db, user_id)
    if user is None:
        return None
    user.roles = db.query(Role).filter(Role.id.in_(role_ids or [])).all()
    db.commit()
    db.refresh(user)
    return user


def create_user(db: Session, user_in: UserCreate):
    data = schema_to_dict(user_in, exclude_unset=False)
    role_ids = data.pop("role_ids", None)
    require_unique(get_user_by_email(db, data["email"]), "Un utilisateur avec cet email existe deja")
    data["mot_de_passe"] = hash_password(data["mot_de_passe"])
    user = User(**data)
    if role_ids:
        user.roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create(db: Session, obj_in: UserCreate):
    return create_user(db, obj_in)


def update_user(db: Session, user_id: int, user_in: UserUpdate):
    user = get_user_by_id(db, user_id)
    if user is None:
        return None
    data = schema_to_dict(user_in)
    role_ids = data.pop("role_ids", None)
    if "email" in data:
        existing = get_user_by_email(db, data["email"])
        if existing is not None and existing.id != user_id:
            raise ValueError("Un utilisateur avec cet email existe deja")
    if "mot_de_passe" in data:
        data["mot_de_passe"] = hash_password(data["mot_de_passe"])
    for field, value in data.items():
        setattr(user, field, value)
    if role_ids is not None:
        user.roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    db.commit()
    db.refresh(user)
    return user


def update(db: Session, db_obj, obj_in: UserUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if user is None:
        return None
    db.delete(user)
    db.commit()
    return user


def delete(db: Session, id: int):
    return delete_user(db, id)


def activate_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if user is None:
        return None
    user.statut = "actif"
    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if user is None:
        return None
    user.statut = "inactif"
    db.commit()
    db.refresh(user)
    return user
