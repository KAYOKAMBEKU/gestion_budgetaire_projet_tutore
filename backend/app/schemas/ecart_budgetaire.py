from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

NatureEcart = Literal["favorable", "defavorable", "neutre"]
NiveauAlerte = Literal["faible", "moyen", "eleve", "critique"]


class EcartBudgetaireBase(BaseModel):
    montant_prevu: Optional[Decimal] = Field(None, ge=0)
    montant_realise: Optional[Decimal] = Field(None, ge=0)
    ecart_montant: Optional[Decimal] = None
    ecart_pourcentage: Optional[Decimal] = None
    nature_ecart: Optional[NatureEcart] = None
    niveau_alerte: Optional[NiveauAlerte] = None
    commentaire_analyse: Optional[str] = None
    ligne_budgetaire_id: int


class EcartBudgetaireCreate(BaseModel):
    ligne_budgetaire_id: int
    commentaire_analyse: Optional[str] = None


class EcartBudgetaireUpdate(BaseModel):
    montant_prevu: Optional[Decimal] = Field(None, ge=0)
    montant_realise: Optional[Decimal] = Field(None, ge=0)
    ecart_montant: Optional[Decimal] = None
    ecart_pourcentage: Optional[Decimal] = None
    nature_ecart: Optional[NatureEcart] = None
    niveau_alerte: Optional[NiveauAlerte] = None
    commentaire_analyse: Optional[str] = None
    ligne_budgetaire_id: Optional[int] = None


class EcartBudgetaireSimpleResponse(EcartBudgetaireBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class EcartBudgetaireResponse(EcartBudgetaireSimpleResponse):
    pass


class EcartBudgetaireDetailResponse(EcartBudgetaireResponse):
    analyse_id: Optional[int] = None
