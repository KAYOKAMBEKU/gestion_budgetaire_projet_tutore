from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .action_corrective import ActionCorrectiveResponse


class AnalyseEcartBase(BaseModel):
    cause: str = Field(..., min_length=2)
    consequence: Optional[str] = None
    recommandation: Optional[str] = None
    date_analyse: Optional[datetime] = Field(default_factory=datetime.utcnow)
    ecart_id: int


class AnalyseEcartCreate(AnalyseEcartBase):
    pass


class AnalyseEcartUpdate(BaseModel):
    cause: Optional[str] = Field(None, min_length=2)
    consequence: Optional[str] = None
    recommandation: Optional[str] = None
    date_analyse: Optional[datetime] = None
    ecart_id: Optional[int] = None


class AnalyseEcartSimpleResponse(AnalyseEcartBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AnalyseEcartResponse(AnalyseEcartSimpleResponse):
    pass


class AnalyseEcartDetailResponse(AnalyseEcartResponse):
    actions_correctives: List[ActionCorrectiveResponse] = []
