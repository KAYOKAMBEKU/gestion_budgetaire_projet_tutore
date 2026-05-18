from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

RapportType = Literal["previsions", "realisations", "ecarts", "global"]
RapportFormat = Literal["pdf", "excel"]


class RapportBudgetaireBase(BaseModel):
    titre: str = Field(..., min_length=2, max_length=150)
    type_rapport: RapportType
    periode_debut: Optional[date] = None
    periode_fin: Optional[date] = None
    date_generation: Optional[datetime] = Field(default_factory=datetime.utcnow)
    format: Optional[RapportFormat] = Field("pdf")
    budget_id: int
    utilisateur_id: int


class RapportBudgetaireCreate(RapportBudgetaireBase):
    pass


class RapportBudgetaireUpdate(BaseModel):
    titre: Optional[str] = Field(None, min_length=2, max_length=150)
    type_rapport: Optional[RapportType] = None
    periode_debut: Optional[date] = None
    periode_fin: Optional[date] = None
    date_generation: Optional[datetime] = None
    format: Optional[RapportFormat] = None
    budget_id: Optional[int] = None
    utilisateur_id: Optional[int] = None

    @model_validator(mode="after")
    def check_period(cls, values):
        if values.periode_debut and values.periode_fin and values.periode_fin < values.periode_debut:
            raise ValueError("periode_fin doit être supérieure ou égale à periode_debut")
        return values


class RapportBudgetaireResponse(RapportBudgetaireBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def check_period(cls, values):
        if values.periode_debut and values.periode_fin and values.periode_fin < values.periode_debut:
            raise ValueError("periode_fin doit être supérieure ou égale à periode_debut")
        return values
