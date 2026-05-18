from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PrevisionBase(BaseModel):
    montant_prevu: Decimal = Field(..., ge=0)
    date_prevision: date
    commentaire: Optional[str] = None
    ligne_budgetaire_id: int


class PrevisionCreate(PrevisionBase):
    pass


class PrevisionUpdate(BaseModel):
    montant_prevu: Optional[Decimal] = Field(None, ge=0)
    date_prevision: Optional[date] = None
    commentaire: Optional[str] = None
    ligne_budgetaire_id: Optional[int] = None


class PrevisionResponse(PrevisionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
