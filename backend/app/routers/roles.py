from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate
from app.services import role_service

router = APIRouter(prefix="/roles", tags=["Roles"])


class AssignPermissionsRequest(BaseModel):
    permission_ids: list[int]


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role introuvable")


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(role_in: RoleCreate, db: Session = Depends(get_db)):
    try:
        return role_service.create_role(db, role_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[RoleResponse])
def get_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return role_service.get_roles(db, skip=skip, limit=limit)


@router.get("/by-name/{nom_role}", response_model=RoleResponse)
def get_role_by_name(nom_role: str, db: Session = Depends(get_db)):
    role = role_service.get_role_by_name(db, nom_role)
    if role is None:
        _not_found()
    return role


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = role_service.get_role_by_id(db, role_id)
    if role is None:
        _not_found()
    return role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, role_in: RoleUpdate, db: Session = Depends(get_db)):
    try:
        role = role_service.update_role(db, role_id, role_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if role is None:
        _not_found()
    return role


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = role_service.delete_role(db, role_id)
    if role is None:
        _not_found()
    return {"message": "Role supprime avec succes"}


@router.patch("/{role_id}/permissions", response_model=RoleResponse)
def assign_permissions_to_role(role_id: int, payload: AssignPermissionsRequest, db: Session = Depends(get_db)):
    role = role_service.assign_permissions_to_role(db, role_id, payload.permission_ids)
    if role is None:
        _not_found()
    return role
