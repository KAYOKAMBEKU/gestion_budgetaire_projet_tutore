from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.prevision import PrevisionCreate, PrevisionResponse, PrevisionUpdate
from app.services import prevision_service

router = APIRouter(prefix="/previsions", tags=["Previsions"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prevision introuvable")


@router.post("/", response_model=PrevisionResponse, status_code=status.HTTP_201_CREATED)
def create_prevision(prevision_in: PrevisionCreate, db: Session = Depends(get_db)):
    try:
        return prevision_service.create_prevision(db, prevision_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[PrevisionResponse])
def get_previsions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return prevision_service.get_previsions(db, skip=skip, limit=limit)


@router.get("/by-ligne/{ligne_budgetaire_id}", response_model=list[PrevisionResponse])
def get_previsions_by_ligne(ligne_budgetaire_id: int, db: Session = Depends(get_db)):
    return prevision_service.get_previsions_by_ligne(db, ligne_budgetaire_id)


@router.get("/{prevision_id}", response_model=PrevisionResponse)
def get_prevision(prevision_id: int, db: Session = Depends(get_db)):
    prevision = prevision_service.get_prevision_by_id(db, prevision_id)
    if prevision is None:
        _not_found()
    return prevision


@router.put("/{prevision_id}", response_model=PrevisionResponse)
def update_prevision(prevision_id: int, prevision_in: PrevisionUpdate, db: Session = Depends(get_db)):
    try:
        prevision = prevision_service.update_prevision(db, prevision_id, prevision_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if prevision is None:
        _not_found()
    return prevision


@router.delete("/{prevision_id}")
def delete_prevision(prevision_id: int, db: Session = Depends(get_db)):
    prevision = prevision_service.delete_prevision(db, prevision_id)
    if prevision is None:
        _not_found()
    return {"message": "Prevision supprimee avec succes"}
