from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ValidationStatut = Literal["valide", "rejete"]


class ValidationBudgetBase(BaseModel):
    statut_validation: ValidationStatut
    commentaire: Optional[str] = None
    date_validation: Optional[datetime] = Field(default_factory=datetime.utcnow)
    budget_id: int
    utilisateur_id: Optional[int] = None


class ValidationBudgetCreate(ValidationBudgetBase):
    pass


class ValidationBudgetUpdate(BaseModel):
    statut_validation: Optional[ValidationStatut] = None
    commentaire: Optional[str] = None
    date_validation: Optional[datetime] = None
    budget_id: Optional[int] = None
    utilisateur_id: Optional[int] = None


class ValidationBudgetResponse(ValidationBudgetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
