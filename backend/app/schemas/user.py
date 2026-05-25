from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from .departement import DepartementSimpleResponse
from .role import RoleSimpleResponse


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
    date_creation: datetime
    departement: Optional[DepartementSimpleResponse] = None
    roles: List[RoleSimpleResponse] = []
