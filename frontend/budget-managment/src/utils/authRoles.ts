import type { AuthUser } from "../types/auth";

type RoleLike = string | { nom_role?: string | null; name?: string | null; role?: string | null };

export function normalizeRoleName(role: RoleLike | null | undefined) {
  const raw = typeof role === "string" ? role : role?.nom_role ?? role?.name ?? role?.role ?? "";
  return raw.trim().toLowerCase();
}

export function hasUserRole(user: AuthUser | null | undefined, roleName: string) {
  const expected = normalizeRoleName(roleName);
  return (user?.roles ?? []).some((role) => normalizeRoleName(role as RoleLike) === expected);
}

export function hasAnyUserRole(user: AuthUser | null | undefined, roleNames: string[]) {
  return roleNames.some((roleName) => hasUserRole(user, roleName));
}

