from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class MouvementFinancier(Base):
    __tablename__ = "mouvements_financiers"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False, index=True)
    ligne_budgetaire_id = Column(Integer, ForeignKey("lignes_budgetaires.id"), nullable=True, index=True)
    type_mouvement = Column(String(20), nullable=False)
    categorie = Column(String(100), nullable=True)
    libelle = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    montant = Column(Numeric(15, 2), nullable=False)
    date_mouvement = Column(Date, nullable=False)
    mode_paiement = Column(String(100), nullable=True)
    reference_paiement = Column(String(150), nullable=True)
    piece_justificative = Column(String(255), nullable=True)
    comptable_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    projet = relationship("Projet", back_populates="mouvements_financiers")
    budget = relationship("Budget", back_populates="mouvements_financiers")
    ligne_budgetaire = relationship("LigneBudgetaire", back_populates="mouvements_financiers")
    comptable = relationship("User", back_populates="mouvements_financiers")
