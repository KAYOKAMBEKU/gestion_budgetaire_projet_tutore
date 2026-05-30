from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True)
    reference = Column(String(100), unique=True, index=True, nullable=False)
    libelle = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    montant_total_prevu = Column(Numeric(15, 2), default=0)
    montant_total_realise = Column(Numeric(15, 2), default=0)
    total_recettes_realisees = Column(Numeric(15, 2), default=0)
    total_depenses_realisees = Column(Numeric(15, 2), default=0)
    taux_execution_budgetaire = Column(Numeric(10, 2), default=0)
    ecart_total = Column(Numeric(15, 2), default=0)
    statut = Column(String(50), default="brouillon")
    date_creation = Column(DateTime, default=datetime.utcnow)

    departement_id = Column(Integer, ForeignKey("departements.id"), nullable=False)
    exercice_id = Column(Integer, ForeignKey("exercices_budgetaires.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=True, unique=True)

    departement = relationship("Departement", back_populates="budgets")
    exercice = relationship("ExerciceBudgetaire", back_populates="budgets")
    created_by = relationship("User", back_populates="budgets_crees")
    projet = relationship("Projet", back_populates="budget")
    lignes_budgetaires = relationship(
        "LigneBudgetaire",
        back_populates="budget",
        cascade="all, delete-orphan",
    )
    validations = relationship(
        "ValidationBudget",
        back_populates="budget",
        cascade="all, delete-orphan",
    )
    rapports = relationship(
        "RapportBudgetaire",
        back_populates="budget",
        cascade="all, delete-orphan",
    )
    mouvements_financiers = relationship(
        "MouvementFinancier",
        back_populates="budget",
        cascade="all, delete-orphan",
    )

    def calculer_total_prevu(self):
        total = sum((ligne.montant_prevu or 0) for ligne in self.lignes_budgetaires)
        self.montant_total_prevu = total
        return self.montant_total_prevu

    def calculer_total_realise(self):
        total = sum((ligne.montant_realise or 0) for ligne in self.lignes_budgetaires)
        self.montant_total_realise = total
        return self.montant_total_realise

    def calculer_ecart_total(self):
        self.ecart_total = (self.montant_total_realise or 0) - (self.montant_total_prevu or 0)
        return self.ecart_total
