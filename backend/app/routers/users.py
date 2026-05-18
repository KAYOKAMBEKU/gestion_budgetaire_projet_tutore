from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


class AssignRolesRequest(BaseModel):
    role_ids: list[int]


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        return user_service.create_user(db, user_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return user_service.get_users(db, skip=skip, limit=limit)


@router.get("/by-email/{email}", response_model=UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    user = user_service.get_user_by_email(db, email)
    if user is None:
        _not_found()
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.get_user_by_id(db, user_id)
    if user is None:
        _not_found()
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    try:
        user = user_service.update_user(db, user_id, user_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if user is None:
        _not_found()
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.delete_user(db, user_id)
    if user is None:
        _not_found()
    return {"message": "Utilisateur supprime avec succes"}


@router.patch("/{user_id}/activate", response_model=UserResponse)
def activate_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.activate_user(db, user_id)
    if user is None:
        _not_found()
    return user


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.deactivate_user(db, user_id)
    if user is None:
        _not_found()
    return user


@router.patch("/{user_id}/roles", response_model=UserResponse)
def assign_roles_to_user(user_id: int, payload: AssignRolesRequest, db: Session = Depends(get_db)):
    user = user_service.assign_roles_to_user(db, user_id, payload.role_ids)
    if user is None:
        _not_found()
    return user
