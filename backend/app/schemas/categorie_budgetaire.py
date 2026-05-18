from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


CategorieType = Literal["recette", "depense"]


class CategorieBudgetaireBase(BaseModel):
    nom: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    type_categorie: CategorieType


class CategorieBudgetaireCreate(CategorieBudgetaireBase):
    pass


class CategorieBudgetaireUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    type_categorie: Optional[CategorieType] = None


class CategorieBudgetaireResponse(CategorieBudgetaireBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
