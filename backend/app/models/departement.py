from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Departement(Base):
    __tablename__ = "departements"

    id = Column(Integer, primary_key=True)
    nom = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    responsable = Column(String(150), nullable=True)
    statut = Column(String(50), default="actif")

    budgets = relationship(
        "Budget",
        back_populates="departement",
        cascade="all, delete-orphan",
    )
    gestionnaires = relationship("User", back_populates="departement")
    projets = relationship("Projet", back_populates="departement", cascade="all, delete-orphan")
