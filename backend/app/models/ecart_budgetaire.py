from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class EcartBudgetaire(Base):
    __tablename__ = "ecarts_budgetaires"

    id = Column(Integer, primary_key=True)
    montant_prevu = Column(Numeric(15, 2), default=0)
    montant_realise = Column(Numeric(15, 2), default=0)
    ecart_montant = Column(Numeric(15, 2), default=0)
    ecart_pourcentage = Column(Numeric(10, 2), default=0)
    nature_ecart = Column(String(50), nullable=True)
    niveau_alerte = Column(String(50), nullable=True)
    commentaire_analyse = Column(Text, nullable=True)
    ligne_budgetaire_id = Column(Integer, ForeignKey("lignes_budgetaires.id"), unique=True, nullable=False)

    ligne_budgetaire = relationship("LigneBudgetaire", back_populates="ecart")
    analyse = relationship(
        "AnalyseEcart",
        uselist=False,
        back_populates="ecart",
        cascade="all, delete-orphan",
    )

    def calculer_ecart(self):
        self.ecart_montant = (self.montant_realise or 0) - (self.montant_prevu or 0)
        return self.ecart_montant

    def determiner_nature_ecart(self):
        type_ligne = getattr(self.ligne_budgetaire, "type_ligne", None)
        if type_ligne == "depense":
            if self.ecart_montant > 0:
                self.nature_ecart = "defavorable"
            elif self.ecart_montant < 0:
                self.nature_ecart = "favorable"
            else:
                self.nature_ecart = "neutre"
        elif type_ligne == "recette":
            if self.ecart_montant > 0:
                self.nature_ecart = "favorable"
            elif self.ecart_montant < 0:
                self.nature_ecart = "defavorable"
            else:
                self.nature_ecart = "neutre"
        else:
            self.nature_ecart = "neutre"
        return self.nature_ecart

    def evaluer_niveau_alerte(self):
        value = abs(self.ecart_pourcentage or 0)
        if value >= 30:
            self.niveau_alerte = "critique"
        elif value >= 15:
            self.niveau_alerte = "eleve"
        elif value >= 5:
            self.niveau_alerte = "moyen"
        else:
            self.niveau_alerte = "faible"
        return self.niveau_alerte
