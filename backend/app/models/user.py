from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from .association_tables import user_roles


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    statut = Column(String(50), default="actif")
    date_creation = Column(DateTime, default=datetime.utcnow)
    departement_id = Column(Integer, ForeignKey("departements.id"), nullable=True)

    roles = relationship(
        "Role",
        secondary=user_roles,
        back_populates="users",
    )
    departement = relationship("Departement", back_populates="gestionnaires")
    budgets_crees = relationship(
        "Budget",
        back_populates="created_by",
        cascade="all, delete-orphan",
    )
    projets_crees = relationship(
        "Projet",
        back_populates="created_by",
        cascade="all, delete-orphan",
        foreign_keys="Projet.created_by_id",
    )
    projets_geres = relationship(
        "Projet",
        back_populates="chef_projet",
        foreign_keys="Projet.chef_projet_id",
    )
    validations = relationship(
        "ValidationBudget",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
    )
    rapports_generes = relationship(
        "RapportBudgetaire",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
    )
    notifications = relationship(
        "Notification",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
    )
