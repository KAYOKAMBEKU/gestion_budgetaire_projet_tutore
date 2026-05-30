from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Projet(Base):
    __tablename__ = "projets"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    titre = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    objectif = Column(Text, nullable=True)
    statut = Column(String(50), default="brouillon")
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_modification = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_debut_prevue = Column(Date, nullable=True)
    date_fin_prevue = Column(Date, nullable=True)
    resultat_attendu = Column(Text, nullable=True)
    cout_estime = Column(Numeric(15, 2), default=0)
    budget_realise_total = Column(Numeric(15, 2), default=0)

    departement_id = Column(Integer, ForeignKey("departements.id"), nullable=False)
    exercice_id = Column(Integer, ForeignKey("exercices_budgetaires.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chef_projet_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    departement = relationship("Departement", back_populates="projets")
    exercice = relationship("ExerciceBudgetaire", back_populates="projets")
    created_by = relationship("User", back_populates="projets_crees", foreign_keys=[created_by_id])
    chef_projet = relationship("User", back_populates="projets_geres", foreign_keys=[chef_projet_id])
    budget = relationship("Budget", back_populates="projet", uselist=False)
    mouvements_financiers = relationship(
        "MouvementFinancier",
        back_populates="projet",
        cascade="all, delete-orphan",
    )
