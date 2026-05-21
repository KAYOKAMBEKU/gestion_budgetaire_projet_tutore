from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from pydantic import BaseModel, Field, ConfigDict

if TYPE_CHECKING:
    from .user import UserSimpleResponse
    from .projet import ProjetSimpleResponse


class DepartementBase(BaseModel):
    nom: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    responsable: Optional[str] = Field(None, max_length=150)
    statut: Optional[str] = Field("actif", max_length=50)


class DepartementCreate(DepartementBase):
    gestionnaire_id: Optional[int] = None


class DepartementUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    responsable: Optional[str] = Field(None, max_length=150)
    statut: Optional[str] = Field(None, max_length=50)
    gestionnaire_id: Optional[int] = None


class DepartementSimpleResponse(DepartementBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


DepartementResponse = DepartementSimpleResponse


class DepartementDetailResponse(DepartementSimpleResponse):
    gestionnaires: List["UserSimpleResponse"] = []
    projets: List["ProjetSimpleResponse"] = []
