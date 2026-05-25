export type BudgetStatus = "brouillon" | "soumis" | "valide" | "rejete" | "en_execution" | "cloture";

export interface Budget {
  id: number;
  reference: string;
  libelle: string;
  description?: string | null;
  montant_total_prevu: number;
  montant_total_realise: number;
  ecart_total: number;
  statut: BudgetStatus;
  date_creation?: string;
  departement_id: number;
  exercice_id: number;
  created_by_id?: number | null;
  projet_id?: number | null;
}

export interface BudgetCreate {
  reference: string;
  libelle: string;
  description?: string;
  projet_id: number;
}

export interface BudgetUpdate {
  reference?: string;
  libelle?: string;
  description?: string;
  statut?: BudgetStatus;
}
