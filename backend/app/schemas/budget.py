from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .departement import DepartementResponse
from .exercice_budgetaire import ExerciceBudgetaireResponse
from .ligne_budgetaire import LigneBudgetaireSimpleResponse
from .projet import ProjetSimpleResponse
from .user import UserSimpleResponse


class BudgetBase(BaseModel):
    reference: Optional[str] = Field(None, min_length=2, max_length=100)
    libelle: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    devise: str = Field("FC", pattern="^(FC|USD)$", max_length=3)
    montant_total_prevu: Optional[Decimal] = Field(None, ge=0)
    montant_total_realise: Optional[Decimal] = Field(None, ge=0)
    total_recettes_realisees: Optional[Decimal] = Field(None, ge=0)
    total_depenses_realisees: Optional[Decimal] = Field(None, ge=0)
    taux_execution_budgetaire: Optional[Decimal] = Field(None, ge=0)
    ecart_total: Optional[Decimal] = Field(None)
    statut: Optional[str] = Field("brouillon", max_length=50)
    model_config = ConfigDict(extra="forbid")


class BudgetCreate(BudgetBase):
    projet_id: int
    montant_total_prevu: Optional[Decimal] = None
    montant_total_realise: Optional[Decimal] = None
    ecart_total: Optional[Decimal] = None


class BudgetUpdate(BaseModel):
    reference: Optional[str] = Field(None, min_length=2, max_length=100)
    libelle: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    montant_total_prevu: Optional[Decimal] = Field(None, ge=0)
    montant_total_realise: Optional[Decimal] = Field(None, ge=0)
    total_recettes_realisees: Optional[Decimal] = Field(None, ge=0)
    total_depenses_realisees: Optional[Decimal] = Field(None, ge=0)
    taux_execution_budgetaire: Optional[Decimal] = Field(None, ge=0)
    ecart_total: Optional[Decimal] = None
    statut: Optional[str] = Field(None, max_length=50)
    model_config = ConfigDict(extra="forbid")


class BudgetSimpleResponse(BudgetBase):
    id: int
    departement_id: int
    exercice_id: int
    created_by_id: int
    projet_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class BudgetResponse(BudgetSimpleResponse):
    departement: Optional[DepartementResponse] = None
    exercice: Optional[ExerciceBudgetaireResponse] = None
    created_by: Optional[UserSimpleResponse] = None
    projet_id: Optional[int] = None
    projet: Optional[ProjetSimpleResponse] = None


class BudgetDetailResponse(BudgetResponse):
    lignes: List[LigneBudgetaireSimpleResponse] = []
