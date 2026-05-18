from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class CategorieBudgetaire(Base):
    __tablename__ = "categories_budgetaires"

    id = Column(Integer, primary_key=True)
    nom = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    type_categorie = Column(String(50), nullable=False)

    lignes_budgetaires = relationship(
        "LigneBudgetaire",
        back_populates="categorie",
        cascade="all, delete-orphan",
    )
