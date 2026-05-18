from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    titre: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=2)
    type_notification: Optional[str] = Field(None, max_length=50)
    est_lue: Optional[bool] = Field(False)
    date_envoi: Optional[datetime] = Field(default_factory=datetime.utcnow)
    utilisateur_id: int


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    titre: Optional[str] = Field(None, min_length=2, max_length=150)
    message: Optional[str] = Field(None, min_length=2)
    type_notification: Optional[str] = Field(None, max_length=50)
    est_lue: Optional[bool] = None
    date_envoi: Optional[datetime] = None
    utilisateur_id: Optional[int] = None


class NotificationResponse(NotificationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
