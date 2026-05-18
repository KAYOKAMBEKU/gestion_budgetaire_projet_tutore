from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

RealisationType = Literal["recette", "depense"]
RealisationStatut = Literal["en_attente", "validee", "rejetee", "annulee"]


class RealisationBase(BaseModel):
    montant_realise: Decimal = Field(..., ge=0)
    date_realisation: date
    reference_piece: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    type_realisation: RealisationType
    statut: Optional[RealisationStatut] = Field("en_attente")
    ligne_budgetaire_id: int


class RealisationCreate(RealisationBase):
    pass


class RealisationUpdate(BaseModel):
    montant_realise: Optional[Decimal] = Field(None, ge=0)
    date_realisation: Optional[date] = None
    reference_piece: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    type_realisation: Optional[RealisationType] = None
    statut: Optional[RealisationStatut] = None
    ligne_budgetaire_id: Optional[int] = None


class RealisationResponse(RealisationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
