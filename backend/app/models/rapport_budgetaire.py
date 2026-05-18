from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class RapportBudgetaire(Base):
    __tablename__ = "rapports_budgetaires"

    id = Column(Integer, primary_key=True)
    titre = Column(String(150), nullable=False)
    type_rapport = Column(String(100), nullable=False)
    periode_debut = Column(Date, nullable=True)
    periode_fin = Column(Date, nullable=True)
    date_generation = Column(DateTime, default=datetime.utcnow)
    format = Column(String(50), default="pdf")
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    utilisateur_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    budget = relationship("Budget", back_populates="rapports")
    utilisateur = relationship("User", back_populates="rapports_generes")
