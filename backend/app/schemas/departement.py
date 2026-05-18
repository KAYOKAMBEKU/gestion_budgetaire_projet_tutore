from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class DepartementBase(BaseModel):
    nom: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    responsable: Optional[str] = Field(None, max_length=150)
    statut: Optional[str] = Field("actif", max_length=50)


class DepartementCreate(DepartementBase):
    pass


class DepartementUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    responsable: Optional[str] = Field(None, max_length=150)
    statut: Optional[str] = Field(None, max_length=50)


class DepartementResponse(DepartementBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
