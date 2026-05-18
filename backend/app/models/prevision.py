from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Prevision(Base):
    __tablename__ = "previsions"

    id = Column(Integer, primary_key=True)
    montant_prevu = Column(Numeric(15, 2), nullable=False)
    date_prevision = Column(Date, nullable=False)
    commentaire = Column(Text, nullable=True)
    ligne_budgetaire_id = Column(Integer, ForeignKey("lignes_budgetaires.id"), nullable=False)

    ligne_budgetaire = relationship("LigneBudgetaire", back_populates="previsions")
