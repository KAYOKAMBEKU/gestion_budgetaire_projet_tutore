from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
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

    roles = relationship(
        "Role",
        secondary=user_roles,
        back_populates="users",
    )
    budgets_crees = relationship(
        "Budget",
        back_populates="created_by",
        cascade="all, delete-orphan",
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
