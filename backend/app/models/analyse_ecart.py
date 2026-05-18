from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database import Base


class AnalyseEcart(Base):
    __tablename__ = "analyses_ecarts"

    id = Column(Integer, primary_key=True)
    cause = Column(Text, nullable=False)
    consequence = Column(Text, nullable=True)
    recommandation = Column(Text, nullable=True)
    date_analyse = Column(DateTime, default=datetime.utcnow)
    ecart_id = Column(Integer, ForeignKey("ecarts_budgetaires.id"), unique=True, nullable=False)

    ecart = relationship("EcartBudgetaire", back_populates="analyse")
    actions_correctives = relationship(
        "ActionCorrective",
        back_populates="analyse",
        cascade="all, delete-orphan",
    )
