from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate
from app.services._utils import require_unique, schema_to_dict, update_model


def get_role_by_id(db: Session, role_id: int):
    return db.query(Role).filter(Role.id == role_id).first()


def get_by_id(db: Session, id: int):
    return get_role_by_id(db, id)


def get_role_by_name(db: Session, nom_role: str):
    return db.query(Role).filter(Role.nom_role == nom_role).first()


def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Role).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_roles(db, skip, limit)


def assign_permissions_to_role(db: Session, role_id: int, permission_ids: list[int]):
    role = get_role_by_id(db, role_id)
    if role is None:
        return None
    role.permissions = db.query(Permission).filter(Permission.id.in_(permission_ids or [])).all()
    db.commit()
    db.refresh(role)
    return role


def create_role(db: Session, role_in: RoleCreate):
    data = schema_to_dict(role_in, exclude_unset=False)
    permission_ids = data.pop("permission_ids", None)
    require_unique(get_role_by_name(db, data["nom_role"]), "Un role avec ce nom existe deja")
    role = Role(**data)
    if permission_ids:
        role.permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def create(db: Session, obj_in: RoleCreate):
    return create_role(db, obj_in)


def update_role(db: Session, role_id: int, role_in: RoleUpdate):
    role = get_role_by_id(db, role_id)
    if role is None:
        return None
    data = schema_to_dict(role_in)
    permission_ids = data.pop("permission_ids", None)
    if "nom_role" in data:
        existing = get_role_by_name(db, data["nom_role"])
        if existing is not None and existing.id != role_id:
            raise ValueError("Un role avec ce nom existe deja")
    for field, value in data.items():
        setattr(role, field, value)
    if permission_ids is not None:
        role.permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
    db.commit()
    db.refresh(role)
    return role


def update(db: Session, db_obj, obj_in: RoleUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_role(db: Session, role_id: int):
    role = get_role_by_id(db, role_id)
    if role is None:
        return None
    db.delete(role)
    db.commit()
    return role


def delete(db: Session, id: int):
    return delete_role(db, id)
