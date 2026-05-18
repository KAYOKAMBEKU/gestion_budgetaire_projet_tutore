from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ecart_budgetaire import EcartBudgetaireCreate, EcartBudgetaireResponse, EcartBudgetaireUpdate
from app.services import ecart_budgetaire_service

router = APIRouter(prefix="/ecarts-budgetaires", tags=["Ecarts budgetaires"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ecart budgetaire introuvable")


@router.post("/", response_model=EcartBudgetaireResponse, status_code=status.HTTP_201_CREATED)
def create_ecart(ecart_in: EcartBudgetaireCreate, db: Session = Depends(get_db)):
    return ecart_budgetaire_service.create_ecart(db, ecart_in)


@router.get("/", response_model=list[EcartBudgetaireResponse])
def get_ecarts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ecart_budgetaire_service.get_ecarts(db, skip=skip, limit=limit)


@router.get("/by-ligne/{ligne_budgetaire_id}", response_model=EcartBudgetaireResponse)
def get_ecart_by_ligne(ligne_budgetaire_id: int, db: Session = Depends(get_db)):
    ecart = ecart_budgetaire_service.get_ecart_by_ligne(db, ligne_budgetaire_id)
    if ecart is None:
        _not_found()
    return ecart


@router.get("/by-nature/{nature_ecart}", response_model=list[EcartBudgetaireResponse])
def get_ecarts_by_nature(nature_ecart: str, db: Session = Depends(get_db)):
    return ecart_budgetaire_service.get_ecarts_by_nature(db, nature_ecart)


@router.get("/by-niveau-alerte/{niveau_alerte}", response_model=list[EcartBudgetaireResponse])
def get_ecarts_by_niveau_alerte(niveau_alerte: str, db: Session = Depends(get_db)):
    return ecart_budgetaire_service.get_ecarts_by_niveau_alerte(db, niveau_alerte)


@router.post("/calculate-for-ligne/{ligne_budgetaire_id}", response_model=EcartBudgetaireResponse)
def calculate_ecart_for_ligne(ligne_budgetaire_id: int, db: Session = Depends(get_db)):
    ecart = ecart_budgetaire_service.calculate_ecart_for_ligne(db, ligne_budgetaire_id)
    if ecart is None:
        _not_found()
    return ecart


@router.get("/{ecart_id}", response_model=EcartBudgetaireResponse)
def get_ecart(ecart_id: int, db: Session = Depends(get_db)):
    ecart = ecart_budgetaire_service.get_ecart_by_id(db, ecart_id)
    if ecart is None:
        _not_found()
    return ecart


@router.put("/{ecart_id}", response_model=EcartBudgetaireResponse)
def update_ecart(ecart_id: int, ecart_in: EcartBudgetaireUpdate, db: Session = Depends(get_db)):
    ecart = ecart_budgetaire_service.update_ecart(db, ecart_id, ecart_in)
    if ecart is None:
        _not_found()
    return ecart


@router.delete("/{ecart_id}")
def delete_ecart(ecart_id: int, db: Session = Depends(get_db)):
    ecart = ecart_budgetaire_service.delete_ecart(db, ecart_id)
    if ecart is None:
        _not_found()
    return {"message": "Ecart budgetaire supprime avec succes"}
