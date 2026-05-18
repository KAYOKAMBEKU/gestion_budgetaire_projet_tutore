from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class PermissionBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class PermissionSimpleResponse(PermissionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PermissionResponse(PermissionSimpleResponse):
    pass
