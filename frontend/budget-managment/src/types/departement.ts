export type DepartementStatus = "actif" | "inactif";

export interface Departement {
  id: number;
  nom: string;
  description?: string | null;
  responsable?: string | null;
  statut: DepartementStatus;
}

export interface DepartementCreate {
  nom: string;
  description?: string;
  responsable?: string;
  statut?: DepartementStatus;
  gestionnaire_id?: number;
}

export interface DepartementUpdate {
  nom?: string;
  description?: string;
  responsable?: string;
  statut?: DepartementStatus;
  gestionnaire_id?: number;
}
