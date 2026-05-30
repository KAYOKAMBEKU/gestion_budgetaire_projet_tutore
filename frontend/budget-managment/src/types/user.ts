import type { Role } from "./role";

export type UserStatus = "actif" | "inactif";

export interface User {
  id: number;
  nom: string;
  prenom?: string | null;
  email: string;
  statut: UserStatus;
  date_creation?: string;
  departement_id?: number | null;
  departement?: {
    id: number;
    nom: string;
  } | null;
  roles?: Role[];
}

export interface UserCreate {
  nom: string;
  prenom?: string;
  email: string;
  mot_de_passe: string;
  statut?: UserStatus;
  role_ids?: number[];
}

export interface UserUpdate {
  nom?: string;
  prenom?: string;
  email?: string;
  mot_de_passe?: string;
  statut?: UserStatus;
  role_ids?: number[];
}
