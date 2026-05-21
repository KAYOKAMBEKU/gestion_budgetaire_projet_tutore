from sqlalchemy import Column, Date, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class ExerciceBudgetaire(Base):
    __tablename__ = "exercices_budgetaires"

    id = Column(Integer, primary_key=True)
    libelle = Column(String(100), unique=True, nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    statut = Column(String(50), default="ouvert")

    budgets = relationship(
        "Budget",
        back_populates="exercice",
        cascade="all, delete-orphan",
    )
    projets = relationship("Projet", back_populates="exercice", cascade="all, delete-orphan")
