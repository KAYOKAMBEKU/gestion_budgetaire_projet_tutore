from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.schemas.permission import PermissionCreate, PermissionUpdate
from app.services._utils import require_unique, schema_to_dict, update_model


def get_permission_by_id(db: Session, permission_id: int):
    return db.query(Permission).filter(Permission.id == permission_id).first()


def get_by_id(db: Session, id: int):
    return get_permission_by_id(db, id)


def get_permission_by_code(db: Session, code: str):
    return db.query(Permission).filter(Permission.code == code).first()


def get_permissions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Permission).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_permissions(db, skip, limit)


def create_permission(db: Session, permission_in: PermissionCreate):
    require_unique(get_permission_by_code(db, permission_in.code), "Une permission avec ce code existe deja")
    permission = Permission(**schema_to_dict(permission_in, exclude_unset=False))
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


def create(db: Session, obj_in: PermissionCreate):
    return create_permission(db, obj_in)


def update_permission(db: Session, permission_id: int, permission_in: PermissionUpdate):
    permission = get_permission_by_id(db, permission_id)
    if permission is None:
        return None
    data = schema_to_dict(permission_in)
    if "code" in data:
        existing = get_permission_by_code(db, data["code"])
        if existing is not None and existing.id != permission_id:
            raise ValueError("Une permission avec ce code existe deja")
    update_model(permission, permission_in)
    db.commit()
    db.refresh(permission)
    return permission


def update(db: Session, db_obj, obj_in: PermissionUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_permission(db: Session, permission_id: int):
    permission = get_permission_by_id(db, permission_id)
    if permission is None:
        return None
    db.delete(permission)
    db.commit()
    return permission


def delete(db: Session, id: int):
    return delete_permission(db, id)
