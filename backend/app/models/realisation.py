from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Realisation(Base):
    __tablename__ = "realisations"

    id = Column(Integer, primary_key=True)
    montant_realise = Column(Numeric(15, 2), nullable=False)
    date_realisation = Column(Date, nullable=False)
    reference_piece = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    type_realisation = Column(String(50), nullable=False)
    statut = Column(String(50), default="en_attente")
    ligne_budgetaire_id = Column(Integer, ForeignKey("lignes_budgetaires.id"), nullable=False)

    ligne_budgetaire = relationship("LigneBudgetaire", back_populates="realisations")
