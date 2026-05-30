export type ValidationBudgetStatus = "valide" | "rejete";

export interface ValidationBudget {
  id: number;
  statut_validation: ValidationBudgetStatus;
  commentaire?: string | null;
  date_validation?: string;
  budget_id: number;
  utilisateur_id: number;
}

export interface ValidationBudgetCreate {
  statut_validation: ValidationBudgetStatus;
  commentaire?: string;
  budget_id: number;
  utilisateur_id: number;
}
