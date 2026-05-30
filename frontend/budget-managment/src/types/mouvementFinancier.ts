import type { Budget } from "./budget";
import type { LigneBudgetaire } from "./ligneBudgetaire";

export type TypeMouvementFinancier = "entree" | "sortie";

export interface MouvementFinancier {
  id: number;
  projet_id: number;
  budget_id: number;
  ligne_budgetaire_id?: number | null;
  type_mouvement: TypeMouvementFinancier;
  categorie?: string | null;
  libelle: string;
  description?: string | null;
  montant: number;
  date_mouvement: string;
  mode_paiement?: string | null;
  reference_paiement?: string | null;
  piece_justificative?: string | null;
  comptable_id: number;
  created_at: string;
  updated_at: string;
}

export interface MouvementFinancierCreate {
  projet_id: number;
  budget_id: number;
  ligne_budgetaire_id?: number | null;
  type_mouvement: TypeMouvementFinancier;
  categorie?: string;
  libelle: string;
  description?: string;
  montant: number;
  date_mouvement: string;
  mode_paiement?: string;
  reference_paiement?: string;
  piece_justificative?: string;
}

export interface LigneExecutionBudgetaire {
  ligne_budgetaire_id: number;
  libelle: string;
  type_ligne: string;
  montant_prevu: number;
  montant_realise: number;
  ecart_montant: number;
  ecart_pourcentage: number;
}

export interface ExecutionBudgetaire {
  projet_id?: number | null;
  budget_id?: number | null;
  statut_budget?: string | null;
  budget_previsionnel: number;
  total_recettes_prevues: number;
  total_recettes_realisees: number;
  total_depenses_prevues: number;
  total_depenses_realisees: number;
  montant_realise_total: number;
  solde_previsionnel: number;
  solde_realise: number;
  ecart_recettes: number;
  ecart_depenses: number;
  ecart_resultat: number;
  taux_execution_budgetaire: number;
  taux_execution_depenses: number;
  taux_execution_recettes: number;
  lignes_budgetaires: LigneExecutionBudgetaire[];
  lignes?: LigneExecutionBudgetaire[];
  mouvements_financiers: MouvementFinancier[];
}

export interface BudgetExecutionContext {
  budget: Budget;
  lignes: LigneBudgetaire[];
  execution?: ExecutionBudgetaire;
}
