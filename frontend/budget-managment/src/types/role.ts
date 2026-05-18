import type { Permission } from "./permission";

export interface Role {
  id: number;
  nom_role: string;
  description?: string | null;
  permissions?: Permission[];
}

export interface RoleCreate {
  nom_role: string;
  description?: string;
  permission_ids?: number[];
}

export interface RoleUpdate {
  nom_role?: string;
  description?: string;
  permission_ids?: number[];
}
