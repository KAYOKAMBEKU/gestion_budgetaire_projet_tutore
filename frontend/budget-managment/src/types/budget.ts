export type BudgetStatus =
  | "brouillon"
  | "soumis"
  | "soumis_gestionnaire"
  | "valide"
  | "valide_gestionnaire"
  | "soumis_admin"
  | "approuve_admin"
  | "rejete"
  | "rejete_gestionnaire"
  | "rejete_admin"
  | "en_execution"
  | "execute"
  | "cloture";

export interface Budget {
  id: number;
  reference: string;
  libelle: string;
  description?: string | null;
  devise?: "FC" | "USD";
  montant_total_prevu: number;
  montant_total_realise: number;
  total_recettes_realisees?: number;
  total_depenses_realisees?: number;
  taux_execution_budgetaire?: number;
  ecart_total: number;
  statut: BudgetStatus;
  date_creation?: string;
  departement_id: number;
  exercice_id: number;
  created_by_id?: number | null;
  projet_id?: number | null;
  exercice?: {
    id: number;
    libelle: string;
    date_debut: string;
    date_fin: string;
    statut: string;
  } | null;
  projet?: {
    id: number;
    code: string;
    titre: string;
    date_debut_prevue?: string | null;
    date_fin_prevue?: string | null;
    departement_id: number;
    chef_projet_id?: number | null;
    chef_projet?: {
      id: number;
      nom: string;
      prenom?: string | null;
      email: string;
    } | null;
    departement?: {
      id: number;
      nom: string;
    } | null;
  } | null;
}

export interface BudgetCreate {
  reference?: string;
  libelle: string;
  description?: string;
  devise?: "FC" | "USD";
  montant_total_prevu?: number;
  projet_id: number;
}

export interface BudgetUpdate {
  reference?: string;
  libelle?: string;
  description?: string;
  statut?: BudgetStatus;
}
