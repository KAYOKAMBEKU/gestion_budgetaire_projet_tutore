from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.categorie_budgetaire import CategorieBudgetaireCreate, CategorieBudgetaireResponse, CategorieBudgetaireUpdate
from app.services import categorie_budgetaire_service

router = APIRouter(prefix="/categories-budgetaires", tags=["Categories budgetaires"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categorie budgetaire introuvable")


@router.post("/", response_model=CategorieBudgetaireResponse, status_code=status.HTTP_201_CREATED)
def create_categorie(categorie_in: CategorieBudgetaireCreate, db: Session = Depends(get_db)):
    try:
        return categorie_budgetaire_service.create_categorie(db, categorie_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[CategorieBudgetaireResponse])
def get_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return categorie_budgetaire_service.get_categories(db, skip=skip, limit=limit)


@router.get("/by-name/{nom}", response_model=CategorieBudgetaireResponse)
def get_categorie_by_name(nom: str, db: Session = Depends(get_db)):
    categorie = categorie_budgetaire_service.get_categorie_by_name(db, nom)
    if categorie is None:
        _not_found()
    return categorie


@router.get("/by-type/{type_categorie}", response_model=list[CategorieBudgetaireResponse])
def get_categories_by_type(type_categorie: str, db: Session = Depends(get_db)):
    try:
        return categorie_budgetaire_service.get_categories_by_type(db, type_categorie)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{categorie_id}", response_model=CategorieBudgetaireResponse)
def get_categorie(categorie_id: int, db: Session = Depends(get_db)):
    categorie = categorie_budgetaire_service.get_categorie_by_id(db, categorie_id)
    if categorie is None:
        _not_found()
    return categorie


@router.put("/{categorie_id}", response_model=CategorieBudgetaireResponse)
def update_categorie(categorie_id: int, categorie_in: CategorieBudgetaireUpdate, db: Session = Depends(get_db)):
    try:
        categorie = categorie_budgetaire_service.update_categorie(db, categorie_id, categorie_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if categorie is None:
        _not_found()
    return categorie


@router.delete("/{categorie_id}")
def delete_categorie(categorie_id: int, db: Session = Depends(get_db)):
    categorie = categorie_budgetaire_service.delete_categorie(db, categorie_id)
    if categorie is None:
        _not_found()
    return {"message": "Categorie budgetaire supprimee avec succes"}
