from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.rapport_budgetaire import RapportBudgetaireCreate, RapportBudgetaireResponse, RapportBudgetaireUpdate
from app.services import rapport_budgetaire_service

router = APIRouter(prefix="/rapports-budgetaires", tags=["Rapports budgetaires"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rapport budgetaire introuvable")


@router.post("/", response_model=RapportBudgetaireResponse, status_code=status.HTTP_201_CREATED)
def create_rapport(rapport_in: RapportBudgetaireCreate, db: Session = Depends(get_db)):
    return rapport_budgetaire_service.create_rapport(db, rapport_in)


@router.get("/", response_model=list[RapportBudgetaireResponse])
def get_rapports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return rapport_budgetaire_service.get_rapports(db, skip=skip, limit=limit)


@router.get("/by-budget/{budget_id}", response_model=list[RapportBudgetaireResponse])
def get_rapports_by_budget(budget_id: int, db: Session = Depends(get_db)):
    return rapport_budgetaire_service.get_rapports_by_budget(db, budget_id)


@router.get("/by-user/{utilisateur_id}", response_model=list[RapportBudgetaireResponse])
def get_rapports_by_user(utilisateur_id: int, db: Session = Depends(get_db)):
    return rapport_budgetaire_service.get_rapports_by_user(db, utilisateur_id)


@router.get("/budget-summary/{budget_id}")
def generate_budget_summary(budget_id: int, db: Session = Depends(get_db)):
    summary = rapport_budgetaire_service.generate_budget_summary(db, budget_id)
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget introuvable")
    return summary


@router.get("/{rapport_id}", response_model=RapportBudgetaireResponse)
def get_rapport(rapport_id: int, db: Session = Depends(get_db)):
    rapport = rapport_budgetaire_service.get_rapport_by_id(db, rapport_id)
    if rapport is None:
        _not_found()
    return rapport


@router.put("/{rapport_id}", response_model=RapportBudgetaireResponse)
def update_rapport(rapport_id: int, rapport_in: RapportBudgetaireUpdate, db: Session = Depends(get_db)):
    rapport = rapport_budgetaire_service.update_rapport(db, rapport_id, rapport_in)
    if rapport is None:
        _not_found()
    return rapport


@router.delete("/{rapport_id}")
def delete_rapport(rapport_id: int, db: Session = Depends(get_db)):
    rapport = rapport_budgetaire_service.delete_rapport(db, rapport_id)
    if rapport is None:
        _not_found()
    return {"message": "Rapport budgetaire supprime avec succes"}
