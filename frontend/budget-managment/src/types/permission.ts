export interface Permission {
  id: number;
  code: string;
  description?: string | null;
}

export interface PermissionCreate {
  code: string;
  description?: string;
}

export interface PermissionUpdate {
  code?: string;
  description?: string;
}
