export type ExerciceBudgetaireStatus = "ouvert" | "cloture";

export interface ExerciceBudgetaire {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: ExerciceBudgetaireStatus;
}

export interface ExerciceBudgetaireCreate {
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut?: ExerciceBudgetaireStatus;
}

export interface ExerciceBudgetaireUpdate {
  libelle?: string;
  date_debut?: string;
  date_fin?: string;
  statut?: ExerciceBudgetaireStatus;
}
