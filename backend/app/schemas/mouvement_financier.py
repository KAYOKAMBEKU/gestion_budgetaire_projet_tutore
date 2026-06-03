from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


TypeMouvement = Literal["entree", "sortie"]


class MouvementFinancierBase(BaseModel):
    projet_id: int
    budget_id: int
    ligne_budgetaire_id: Optional[int] = None
    type_mouvement: TypeMouvement
    categorie: Optional[str] = Field(None, max_length=100)
    libelle: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    montant: Decimal = Field(..., gt=0)
    date_mouvement: date
    mode_paiement: Optional[str] = Field(None, max_length=100)
    reference_paiement: Optional[str] = Field(None, max_length=150)
    piece_justificative: Optional[str] = Field(None, max_length=255)
    model_config = ConfigDict(extra="forbid")

    @field_validator("mode_paiement")
    def _validate_mode_paiement(cls, v):
        if v is None:
            return v
        mapping = {
            "cash": "Cash",
            "mobile money": "Mobile Money",
            "mobilemoney": "Mobile Money",
            "banque": "Banque",
        }
        key = str(v).strip().lower()
        if key in mapping:
            return mapping[key]
        # accept already-correct values
        if v in mapping.values():
            return v
        raise ValueError("mode_paiement invalide. Valeurs autorisees: Cash, Mobile Money, Banque")


class MouvementFinancierCreate(MouvementFinancierBase):
    pass


class MouvementFinancierUpdate(BaseModel):
    ligne_budgetaire_id: Optional[int] = None
    categorie: Optional[str] = Field(None, max_length=100)
    libelle: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    montant: Optional[Decimal] = Field(None, gt=0)
    date_mouvement: Optional[date] = None
    mode_paiement: Optional[str] = Field(None, max_length=100)
    reference_paiement: Optional[str] = Field(None, max_length=150)
    piece_justificative: Optional[str] = Field(None, max_length=255)
    model_config = ConfigDict(extra="forbid")


class MouvementFinancierResponse(MouvementFinancierBase):
    id: int
    comptable_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SyntheseFinanciereProjet(BaseModel):
    projet_id: Optional[int] = None
    budget_id: Optional[int] = None
    devise: str = "FC"
    montant_realise_total: Decimal
    total_recettes_prevues: Decimal
    total_recettes_realisees: Decimal
    total_depenses_prevues: Decimal
    total_depenses_realisees: Decimal
    solde_previsionnel: Decimal
    solde_realise: Decimal
    ecart_recettes: Decimal
    ecart_depenses: Decimal
    ecart_resultat: Decimal
    taux_execution_budgetaire: Decimal
    taux_execution_depenses: Decimal
    taux_execution_recettes: Decimal


class LigneExecutionBudgetaire(BaseModel):
    ligne_budgetaire_id: int
    libelle: str
    type_ligne: str
    montant_prevu: Decimal
    montant_realise: Decimal
    ecart_montant: Decimal
    ecart_pourcentage: Decimal


class ExecutionBudgetaireResponse(SyntheseFinanciereProjet):
    statut_budget: Optional[str] = None
    budget_previsionnel: Decimal
    lignes_budgetaires: list[LigneExecutionBudgetaire]
    mouvements_financiers: list[MouvementFinancierResponse]


class AnalyseEcartsBudget(ExecutionBudgetaireResponse):
    total_prevu: Decimal
    total_realise: Decimal
    ecart_total: Decimal
    lignes: list[LigneExecutionBudgetaire]
