from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from .categorie_budgetaire import CategorieBudgetaireResponse


LigneType = Literal["recette", "depense"]


class LigneBudgetaireBase(BaseModel):
    libelle: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    montant_prevu: Optional[Decimal] = Field(None, ge=0)
    montant_realise: Optional[Decimal] = Field(None, ge=0)
    ecart_montant: Optional[Decimal] = None
    ecart_pourcentage: Optional[Decimal] = None
    type_ligne: LigneType
    budget_id: int
    categorie_id: int


class LigneBudgetaireCreate(LigneBudgetaireBase):
    montant_realise: Optional[Decimal] = None
    ecart_montant: Optional[Decimal] = None
    ecart_pourcentage: Optional[Decimal] = None


class LigneBudgetaireUpdate(BaseModel):
    libelle: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    montant_prevu: Optional[Decimal] = Field(None, ge=0)
    montant_realise: Optional[Decimal] = Field(None, ge=0)
    ecart_montant: Optional[Decimal] = None
    ecart_pourcentage: Optional[Decimal] = None
    type_ligne: Optional[LigneType] = None
    budget_id: Optional[int] = None
    categorie_id: Optional[int] = None


class LigneBudgetaireSimpleResponse(LigneBudgetaireBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class LigneBudgetaireResponse(LigneBudgetaireSimpleResponse):
    categorie: Optional[CategorieBudgetaireResponse] = None


class LigneBudgetaireDetailResponse(LigneBudgetaireResponse):
    prevision_ids: List[int] = []
    realisation_ids: List[int] = []
    ecart_id: Optional[int] = None
