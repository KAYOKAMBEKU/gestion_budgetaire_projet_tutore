from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.validation_budget import ValidationBudgetCreate, ValidationBudgetResponse
from app.services import validation_budget_service

router = APIRouter(prefix="/validations-budgetaires", tags=["Validations budgetaires"])


class ValidationActionRequest(BaseModel):
    utilisateur_id: int
    commentaire: Optional[str] = None


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Validation budgetaire introuvable")


@router.post("/", response_model=ValidationBudgetResponse, status_code=status.HTTP_201_CREATED)
def create_validation(validation_in: ValidationBudgetCreate, db: Session = Depends(get_db)):
    return validation_budget_service.create_validation(db, validation_in)


@router.get("/", response_model=list[ValidationBudgetResponse])
def get_validations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return validation_budget_service.get_validations(db, skip=skip, limit=limit)


@router.get("/by-budget/{budget_id}", response_model=list[ValidationBudgetResponse])
def get_validations_by_budget(budget_id: int, db: Session = Depends(get_db)):
    return validation_budget_service.get_validations_by_budget(db, budget_id)


@router.get("/by-user/{utilisateur_id}", response_model=list[ValidationBudgetResponse])
def get_validations_by_user(utilisateur_id: int, db: Session = Depends(get_db)):
    return validation_budget_service.get_validations_by_user(db, utilisateur_id)


@router.post("/validate-budget/{budget_id}", response_model=ValidationBudgetResponse, status_code=status.HTTP_201_CREATED)
def validate_budget(budget_id: int, payload: ValidationActionRequest, db: Session = Depends(get_db)):
    validation = validation_budget_service.validate_budget(db, budget_id, payload.utilisateur_id, payload.commentaire)
    if validation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget introuvable")
    return validation


@router.post("/reject-budget/{budget_id}", response_model=ValidationBudgetResponse, status_code=status.HTTP_201_CREATED)
def reject_budget(budget_id: int, payload: ValidationActionRequest, db: Session = Depends(get_db)):
    validation = validation_budget_service.reject_budget(db, budget_id, payload.utilisateur_id, payload.commentaire)
    if validation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget introuvable")
    return validation


@router.get("/{validation_id}", response_model=ValidationBudgetResponse)
def get_validation(validation_id: int, db: Session = Depends(get_db)):
    validation = validation_budget_service.get_validation_by_id(db, validation_id)
    if validation is None:
        _not_found()
    return validation


@router.delete("/{validation_id}")
def delete_validation(validation_id: int, db: Session = Depends(get_db)):
    validation = validation_budget_service.delete_validation(db, validation_id)
    if validation is None:
        _not_found()
    return {"message": "Validation budgetaire supprimee avec succes"}
