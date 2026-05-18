export interface AuthUser {
  id: number;
  nom: string;
  prenom?: string | null;
  email: string;
  statut: "actif" | "inactif";
  date_creation?: string;
  roles: string[];
  permissions: string[];
  departement_id?: number;
  departement?: {
    id: number;
    nom: string;
  };
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}
