from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ValidationBudget(Base):
    __tablename__ = "validations_budgetaires"

    id = Column(Integer, primary_key=True)
    statut_validation = Column(String(50), nullable=False)
    commentaire = Column(Text, nullable=True)
    date_validation = Column(DateTime, default=datetime.utcnow)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    utilisateur_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    budget = relationship("Budget", back_populates="validations")
    utilisateur = relationship("User", back_populates="validations")
