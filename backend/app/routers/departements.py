from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.departement import DepartementCreate, DepartementResponse, DepartementUpdate
from app.services import departement_service

router = APIRouter(prefix="/departements", tags=["Departements"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Departement introuvable")


@router.post("/", response_model=DepartementResponse, status_code=status.HTTP_201_CREATED)
def create_departement(departement_in: DepartementCreate, db: Session = Depends(get_db)):
    try:
        return departement_service.create_departement(db, departement_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[DepartementResponse])
def get_departements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return departement_service.get_departements(db, skip=skip, limit=limit)


@router.get("/by-name/{nom}", response_model=DepartementResponse)
def get_departement_by_name(nom: str, db: Session = Depends(get_db)):
    departement = departement_service.get_departement_by_name(db, nom)
    if departement is None:
        _not_found()
    return departement


@router.get("/{departement_id}", response_model=DepartementResponse)
def get_departement(departement_id: int, db: Session = Depends(get_db)):
    departement = departement_service.get_departement_by_id(db, departement_id)
    if departement is None:
        _not_found()
    return departement


@router.put("/{departement_id}", response_model=DepartementResponse)
def update_departement(departement_id: int, departement_in: DepartementUpdate, db: Session = Depends(get_db)):
    try:
        departement = departement_service.update_departement(db, departement_id, departement_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if departement is None:
        _not_found()
    return departement


@router.delete("/{departement_id}")
def delete_departement(departement_id: int, db: Session = Depends(get_db)):
    departement = departement_service.delete_departement(db, departement_id)
    if departement is None:
        _not_found()
    return {"message": "Departement supprime ou desactive avec succes"}


@router.patch("/{departement_id}/activate", response_model=DepartementResponse)
def activate_departement(departement_id: int, db: Session = Depends(get_db)):
    departement = departement_service.activate_departement(db, departement_id)
    if departement is None:
        _not_found()
    return departement


@router.patch("/{departement_id}/deactivate", response_model=DepartementResponse)
def deactivate_departement(departement_id: int, db: Session = Depends(get_db)):
    departement = departement_service.deactivate_departement(db, departement_id)
    if departement is None:
        _not_found()
    return departement
