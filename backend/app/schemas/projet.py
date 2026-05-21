from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, model_validator

if TYPE_CHECKING:
    from .departement import DepartementSimpleResponse
    from .exercice_budgetaire import ExerciceBudgetaireResponse
    from .budget import BudgetSimpleResponse
    from .user import UserSimpleResponse


class ProjetBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=100)
    titre: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    objectif: Optional[str] = None
    resultat_attendu: Optional[str] = None
    date_debut_prevue: Optional[date] = None
    date_fin_prevue: Optional[date] = None
    cout_estime: Optional[Decimal] = Field(None, ge=0)
    budget_realise_total: Optional[Decimal] = Field(None, ge=0)


class ProjetCreate(ProjetBase):
    exercice_id: int


class ProjetUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=100)
    titre: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    objectif: Optional[str] = None
    resultat_attendu: Optional[str] = None
    statut: Optional[str] = Field(None, max_length=50)
    date_debut_prevue: Optional[date] = None
    date_fin_prevue: Optional[date] = None
    cout_estime: Optional[Decimal] = Field(None, ge=0)
    budget_realise_total: Optional[Decimal] = Field(None, ge=0)
    departement_id: Optional[int] = None
    exercice_id: Optional[int] = None
    created_by_id: Optional[int] = None
    chef_projet_id: Optional[int] = None

    @model_validator(mode="after")
    def check_dates(cls, values):
        debut = values.date_debut_prevue
        fin = values.date_fin_prevue
        if debut is not None and fin is not None and fin < debut:
            raise ValueError("date_fin_prevue doit être supérieure ou égale à date_debut_prevue")
        return values


class ProjetSimpleResponse(ProjetBase):
    id: int
    statut: str
    date_creation: datetime
    date_modification: Optional[datetime] = None
    departement_id: int
    exercice_id: int
    created_by_id: int
    chef_projet_id: Optional[int] = None
    resultat_attendu: Optional[str] = None
    budget_realise_total: Optional[Decimal] = None
    model_config = ConfigDict(from_attributes=True)


class ProjetResponse(ProjetSimpleResponse):
    departement: Optional["DepartementSimpleResponse"] = None
    chef_projet: Optional["UserSimpleResponse"] = None
    created_by: Optional["UserSimpleResponse"] = None
    pass


class ProjetDetailResponse(ProjetResponse):
    departement: Optional["DepartementSimpleResponse"] = None
    exercice: Optional["ExerciceBudgetaireResponse"] = None
    created_by: Optional["UserSimpleResponse"] = None
    budget: Optional["BudgetSimpleResponse"] = None
