from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict

if TYPE_CHECKING:
    from .departement import DepartementSimpleResponse


class UserBase(BaseModel):
    nom: str = Field(..., min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    statut: Optional[str] = Field("actif", max_length=50)


class UserCreate(UserBase):
    mot_de_passe: str = Field(..., min_length=8, max_length=255)
    role_ids: Optional[List[int]] = None
    departement_id: Optional[int] = None


class UserUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    mot_de_passe: Optional[str] = Field(None, min_length=8, max_length=255)
    statut: Optional[str] = Field(None, max_length=50)
    role_ids: Optional[List[int]] = None
    departement_id: Optional[int] = None


class UserSimpleResponse(UserBase):
    id: int
    departement_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserSimpleResponse):
    departement: Optional["DepartementSimpleResponse"] = None
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    mot_de_passe: Optional[str] = Field(None, min_length=8, max_length=255)
    statut: Optional[str] = Field(None, max_length=50)
    role_ids: Optional[List[int]] = None


class UserSimpleResponse(UserBase):
    id: int
    date_creation: datetime
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserSimpleResponse):
    pass
