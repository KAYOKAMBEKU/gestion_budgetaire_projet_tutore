from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from .permission import PermissionSimpleResponse


class RoleBase(BaseModel):
    nom_role: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = None


class RoleUpdate(BaseModel):
    nom_role: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleSimpleResponse(RoleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class RoleResponse(RoleSimpleResponse):
    permissions: List[PermissionSimpleResponse] = []
