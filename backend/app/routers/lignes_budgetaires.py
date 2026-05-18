from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ligne_budgetaire import LigneBudgetaireCreate, LigneBudgetaireResponse, LigneBudgetaireUpdate
from app.services import ligne_budgetaire_service

router = APIRouter(prefix="/lignes-budgetaires", tags=["Lignes budgetaires"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ligne budgetaire introuvable")


@router.post("/", response_model=LigneBudgetaireResponse, status_code=status.HTTP_201_CREATED)
def create_ligne(ligne_in: LigneBudgetaireCreate, db: Session = Depends(get_db)):
    try:
        return ligne_budgetaire_service.create_ligne(db, ligne_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[LigneBudgetaireResponse])
def get_lignes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ligne_budgetaire_service.get_lignes(db, skip=skip, limit=limit)


@router.get("/by-budget/{budget_id}", response_model=list[LigneBudgetaireResponse])
def get_lignes_by_budget(budget_id: int, db: Session = Depends(get_db)):
    return ligne_budgetaire_service.get_lignes_by_budget(db, budget_id)


@router.get("/by-categorie/{categorie_id}", response_model=list[LigneBudgetaireResponse])
def get_lignes_by_categorie(categorie_id: int, db: Session = Depends(get_db)):
    return ligne_budgetaire_service.get_lignes_by_categorie(db, categorie_id)


@router.get("/{ligne_id}", response_model=LigneBudgetaireResponse)
def get_ligne(ligne_id: int, db: Session = Depends(get_db)):
    ligne = ligne_budgetaire_service.get_ligne_by_id(db, ligne_id)
    if ligne is None:
        _not_found()
    return ligne


@router.put("/{ligne_id}", response_model=LigneBudgetaireResponse)
def update_ligne(ligne_id: int, ligne_in: LigneBudgetaireUpdate, db: Session = Depends(get_db)):
    try:
        ligne = ligne_budgetaire_service.update_ligne(db, ligne_id, ligne_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if ligne is None:
        _not_found()
    return ligne


@router.delete("/{ligne_id}")
def delete_ligne(ligne_id: int, db: Session = Depends(get_db)):
    ligne = ligne_budgetaire_service.delete_ligne(db, ligne_id)
    if ligne is None:
        _not_found()
    return {"message": "Ligne budgetaire supprimee avec succes"}


@router.patch("/{ligne_id}/recalculate", response_model=LigneBudgetaireResponse)
def recalculate_ligne(ligne_id: int, db: Session = Depends(get_db)):
    ligne = ligne_budgetaire_service.recalculate_ligne(db, ligne_id)
    if ligne is None:
        _not_found()
    return ligne
