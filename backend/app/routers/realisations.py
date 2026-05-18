from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.realisation import RealisationCreate, RealisationResponse, RealisationUpdate
from app.services import realisation_service

router = APIRouter(prefix="/realisations", tags=["Realisations"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Realisation introuvable")


@router.post("/", response_model=RealisationResponse, status_code=status.HTTP_201_CREATED)
def create_realisation(realisation_in: RealisationCreate, db: Session = Depends(get_db)):
    try:
        return realisation_service.create_realisation(db, realisation_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[RealisationResponse])
def get_realisations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return realisation_service.get_realisations(db, skip=skip, limit=limit)


@router.get("/by-ligne/{ligne_budgetaire_id}", response_model=list[RealisationResponse])
def get_realisations_by_ligne(ligne_budgetaire_id: int, db: Session = Depends(get_db)):
    return realisation_service.get_realisations_by_ligne(db, ligne_budgetaire_id)


@router.get("/by-statut/{statut}", response_model=list[RealisationResponse])
def get_realisations_by_statut(statut: str, db: Session = Depends(get_db)):
    return realisation_service.get_realisations_by_statut(db, statut)


@router.get("/{realisation_id}", response_model=RealisationResponse)
def get_realisation(realisation_id: int, db: Session = Depends(get_db)):
    realisation = realisation_service.get_realisation_by_id(db, realisation_id)
    if realisation is None:
        _not_found()
    return realisation


@router.put("/{realisation_id}", response_model=RealisationResponse)
def update_realisation(realisation_id: int, realisation_in: RealisationUpdate, db: Session = Depends(get_db)):
    try:
        realisation = realisation_service.update_realisation(db, realisation_id, realisation_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if realisation is None:
        _not_found()
    return realisation


@router.delete("/{realisation_id}")
def delete_realisation(realisation_id: int, db: Session = Depends(get_db)):
    realisation = realisation_service.delete_realisation(db, realisation_id)
    if realisation is None:
        _not_found()
    return {"message": "Realisation supprimee avec succes"}


@router.patch("/{realisation_id}/validate", response_model=RealisationResponse)
def validate_realisation(realisation_id: int, db: Session = Depends(get_db)):
    realisation = realisation_service.validate_realisation(db, realisation_id)
    if realisation is None:
        _not_found()
    return realisation


@router.patch("/{realisation_id}/reject", response_model=RealisationResponse)
def reject_realisation(realisation_id: int, db: Session = Depends(get_db)):
    realisation = realisation_service.reject_realisation(db, realisation_id)
    if realisation is None:
        _not_found()
    return realisation


@router.patch("/{realisation_id}/cancel", response_model=RealisationResponse)
def cancel_realisation(realisation_id: int, db: Session = Depends(get_db)):
    realisation = realisation_service.cancel_realisation(db, realisation_id)
    if realisation is None:
        _not_found()
    return realisation
