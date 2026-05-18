from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.permission import PermissionCreate, PermissionResponse, PermissionUpdate
from app.services import permission_service

router = APIRouter(prefix="/permissions", tags=["Permissions"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission introuvable")


@router.post("/", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_permission(permission_in: PermissionCreate, db: Session = Depends(get_db)):
    try:
        return permission_service.create_permission(db, permission_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[PermissionResponse])
def get_permissions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return permission_service.get_permissions(db, skip=skip, limit=limit)


@router.get("/by-code/{code}", response_model=PermissionResponse)
def get_permission_by_code(code: str, db: Session = Depends(get_db)):
    permission = permission_service.get_permission_by_code(db, code)
    if permission is None:
        _not_found()
    return permission


@router.get("/{permission_id}", response_model=PermissionResponse)
def get_permission(permission_id: int, db: Session = Depends(get_db)):
    permission = permission_service.get_permission_by_id(db, permission_id)
    if permission is None:
        _not_found()
    return permission


@router.put("/{permission_id}", response_model=PermissionResponse)
def update_permission(permission_id: int, permission_in: PermissionUpdate, db: Session = Depends(get_db)):
    try:
        permission = permission_service.update_permission(db, permission_id, permission_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if permission is None:
        _not_found()
    return permission


@router.delete("/{permission_id}")
def delete_permission(permission_id: int, db: Session = Depends(get_db)):
    permission = permission_service.delete_permission(db, permission_id)
    if permission is None:
        _not_found()
    return {"message": "Permission supprimee avec succes"}
