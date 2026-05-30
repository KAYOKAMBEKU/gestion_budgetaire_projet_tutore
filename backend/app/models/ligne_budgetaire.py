from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class LigneBudgetaire(Base):
    __tablename__ = "lignes_budgetaires"

    id = Column(Integer, primary_key=True)
    libelle = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    montant_prevu = Column(Numeric(15, 2), default=0)
    montant_realise = Column(Numeric(15, 2), default=0)
    ecart_montant = Column(Numeric(15, 2), default=0)
    ecart_pourcentage = Column(Numeric(10, 2), default=0)
    type_ligne = Column(String(50), nullable=False)

    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    categorie_id = Column(Integer, ForeignKey("categories_budgetaires.id"), nullable=False)

    budget = relationship("Budget", back_populates="lignes_budgetaires")
    categorie = relationship("CategorieBudgetaire", back_populates="lignes_budgetaires")
    previsions = relationship(
        "Prevision",
        back_populates="ligne_budgetaire",
        cascade="all, delete-orphan",
    )
    realisations = relationship(
        "Realisation",
        back_populates="ligne_budgetaire",
        cascade="all, delete-orphan",
    )
    ecart = relationship(
        "EcartBudgetaire",
        uselist=False,
        back_populates="ligne_budgetaire",
        cascade="all, delete-orphan",
    )
    mouvements_financiers = relationship(
        "MouvementFinancier",
        back_populates="ligne_budgetaire",
    )

    def calculer_montant_realise(self):
        total = sum((realisation.montant_realise or 0) for realisation in self.realisations)
        self.montant_realise = total
        return self.montant_realise

    def calculer_ecart(self):
        self.ecart_montant = (self.montant_realise or 0) - (self.montant_prevu or 0)
        return self.ecart_montant

    def calculer_pourcentage_ecart(self):
        if not self.montant_prevu:
            self.ecart_pourcentage = 0
        else:
            self.ecart_pourcentage = ((self.ecart_montant or 0) / self.montant_prevu) * 100
        return self.ecart_pourcentage
