export type ProjetStatus = "brouillon" | "soumis" | "approuve" | "rejete" | "en_execution" | "cloture";

export interface Projet {
  id: number;
  code: string;
  titre: string;
  description?: string | null;
  objectif?: string | null;
  resultat_attendu?: string | null;
  statut: ProjetStatus;
  date_creation?: string;
  date_modification?: string;
  date_debut_prevue?: string | null;
  date_fin_prevue?: string | null;
  cout_estime: number;
  budget_realise_total?: number;
  departement_id: number;
  exercice_id: number;
  created_by_id: number;
  chef_projet_id?: number | null;
  departement?: {
    id: number;
    nom: string;
  };
  chef_projet?: {
    id: number;
    nom: string;
    prenom?: string | null;
    email: string;
  };
  created_by?: {
    id: number;
    nom: string;
    prenom?: string | null;
    email: string;
  };
}

export interface ProjetCreate {
  code: string;
  titre: string;
  description?: string;
  objectif?: string;
  resultat_attendu?: string;
  date_debut_prevue?: string;
  date_fin_prevue?: string;
  cout_estime?: number;
  departement_id: number;
  exercice_id: number;
  created_by_id: number;
  chef_projet_id: number;
}

export interface ProjetUpdate {
  code?: string;
  titre?: string;
  description?: string;
  objectif?: string;
  resultat_attendu?: string;
  statut?: ProjetStatus;
  date_debut_prevue?: string;
  date_fin_prevue?: string;
  cout_estime?: number;
  budget_realise_total?: number;
  departement_id?: number;
  exercice_id?: number;
  created_by_id?: number;
  chef_projet_id?: number;
}
