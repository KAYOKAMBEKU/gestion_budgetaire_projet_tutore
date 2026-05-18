from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExerciceBudgetaireBase(BaseModel):
    libelle: str = Field(..., min_length=2, max_length=100)
    date_debut: date
    date_fin: date
    statut: Optional[str] = Field("ouvert", max_length=50)


class ExerciceBudgetaireCreate(ExerciceBudgetaireBase):
    pass


class ExerciceBudgetaireUpdate(BaseModel):
    libelle: Optional[str] = Field(None, min_length=2, max_length=100)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[str] = Field(None, max_length=50)

    @model_validator(mode="after")
    def check_dates(cls, values):
        date_debut = values.date_debut
        date_fin = values.date_fin
        if date_debut is not None and date_fin is not None and date_fin < date_debut:
            raise ValueError("date_fin doit être supérieure ou égale à date_debut")
        return values


class ExerciceBudgetaireResponse(ExerciceBudgetaireBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def check_dates(cls, values):
        if values.date_fin < values.date_debut:
            raise ValueError("date_fin doit être supérieure ou égale à date_debut")
        return values
