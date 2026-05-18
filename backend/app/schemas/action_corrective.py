from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

ActionStatut = Literal["planifiee", "en_cours", "terminee", "annulee"]


class ActionCorrectiveBase(BaseModel):
    libelle: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[ActionStatut] = Field("planifiee")
    responsable: Optional[str] = Field(None, max_length=150)
    analyse_id: int


class ActionCorrectiveCreate(ActionCorrectiveBase):
    pass


class ActionCorrectiveUpdate(BaseModel):
    libelle: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[ActionStatut] = None
    responsable: Optional[str] = Field(None, max_length=150)
    analyse_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_dates(cls, values):
        if values.date_debut and values.date_fin and values.date_fin < values.date_debut:
            raise ValueError("date_fin doit être supérieure ou égale à date_debut")
        return values


class ActionCorrectiveResponse(ActionCorrectiveBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
