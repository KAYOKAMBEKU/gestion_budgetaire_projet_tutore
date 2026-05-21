from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.exercice_budgetaire import ExerciceBudgetaireCreate, ExerciceBudgetaireResponse, ExerciceBudgetaireUpdate
from app.services import exercice_budgetaire_service

router = APIRouter(prefix="/exercices-budgetaires", tags=["Exercices budgetaires"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercice budgetaire introuvable")


@router.post("/", response_model=ExerciceBudgetaireResponse, status_code=status.HTTP_201_CREATED)
def create_exercice(exercice_in: ExerciceBudgetaireCreate, db: Session = Depends(get_db)):
    try:
        return exercice_budgetaire_service.create_exercice(db, exercice_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[ExerciceBudgetaireResponse])
def get_exercices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return exercice_budgetaire_service.get_exercices(db, skip=skip, limit=limit)


@router.get("/active", response_model=ExerciceBudgetaireResponse)
def get_active_exercice(db: Session = Depends(get_db)):
    exercice = exercice_budgetaire_service.get_active_exercice(db)
    if exercice is None:
        _not_found()
    return exercice


@router.get("/by-libelle/{libelle}", response_model=ExerciceBudgetaireResponse)
def get_exercice_by_libelle(libelle: str, db: Session = Depends(get_db)):
    exercice = exercice_budgetaire_service.get_exercice_by_libelle(db, libelle)
    if exercice is None:
        _not_found()
    return exercice


@router.get("/{exercice_id}", response_model=ExerciceBudgetaireResponse)
def get_exercice(exercice_id: int, db: Session = Depends(get_db)):
    exercice = exercice_budgetaire_service.get_exercice_by_id(db, exercice_id)
    if exercice is None:
        _not_found()
    return exercice


@router.put("/{exercice_id}", response_model=ExerciceBudgetaireResponse)
def update_exercice(exercice_id: int, exercice_in: ExerciceBudgetaireUpdate, db: Session = Depends(get_db)):
    try:
        exercice = exercice_budgetaire_service.update_exercice(db, exercice_id, exercice_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if exercice is None:
        _not_found()
    return exercice


@router.delete("/{exercice_id}")
def delete_exercice(exercice_id: int, db: Session = Depends(get_db)):
    exercice = exercice_budgetaire_service.delete_exercice(db, exercice_id)
    if exercice is None:
        _not_found()
    return {"message": "Exercice budgetaire supprime avec succes"}


@router.patch("/{exercice_id}/open", response_model=ExerciceBudgetaireResponse)
def open_exercice(exercice_id: int, db: Session = Depends(get_db)):
    try:
        exercice = exercice_budgetaire_service.open_exercice(db, exercice_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if exercice is None:
        _not_found()
    return exercice


@router.patch("/{exercice_id}/close", response_model=ExerciceBudgetaireResponse)
def close_exercice(exercice_id: int, db: Session = Depends(get_db)):
    try:
        exercice = exercice_budgetaire_service.close_exercice(db, exercice_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if exercice is None:
        _not_found()
    return exercice
