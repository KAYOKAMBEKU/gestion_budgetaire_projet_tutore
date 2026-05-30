/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getApiErrorMessage } from "../api/client";
import { authService } from "../services/authService";
import type { AuthUser } from "../types/auth";
import { hasAnyUserRole, hasUserRole } from "../utils/authRoles";

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  roles: string[];
  permissions: string[];
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isBudgetManager: boolean;
  isProjectManager: boolean;
  isComptable: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function enrichUserWithTemporaryDepartment(user: AuthUser): AuthUser {
  const isManagerRole = hasAnyUserRole(user, ["Gestionnaire", "Gestionnaire Budgetaire"]);
  if (!isManagerRole || user.departement_id) {
    return user;
  }

  // TODO: remplacer ce rattachement temporaire par le departement renvoye par le backend.
  return {
    ...user,
    departement_id: 1,
    departement: {
      id: 1,
      nom: "Finance",
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem("budget_admin_user");
    return savedUser ? (JSON.parse(savedUser) as AuthUser) : null;
  });
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem("budget_access_token")));

  useEffect(() => {
    const token = localStorage.getItem("budget_access_token");
    if (!token) {
      return;
    }

    authService
      .me()
      .then((user) => {
        const enrichedUser = enrichUserWithTemporaryDepartment(user);
        localStorage.setItem("budget_admin_user", JSON.stringify(enrichedUser));
        setCurrentUser(enrichedUser);
      })
      .catch(() => {
        localStorage.removeItem("budget_access_token");
        localStorage.removeItem("budget_admin_user");
        setCurrentUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      setCurrentUser(null);
      setAuthLoading(false);
    }

    window.addEventListener("budget:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("budget:auth-expired", handleAuthExpired);
  }, []);

  const isBudgetManager = hasUserRole(currentUser, "Gestionnaire Budgetaire");
  const isProjectManager = hasUserRole(currentUser, "Chef de projet");
  const isComptable = hasUserRole(currentUser, "Comptable");

  const value: AuthContextValue = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      authLoading,
      roles: currentUser?.roles ?? [],
      permissions: currentUser?.permissions ?? [],
      hasPermission: (permissionCode) => currentUser?.permissions.includes(permissionCode) ?? false,
      hasRole: (roleName) => hasUserRole(currentUser, roleName),
      isAdmin: hasUserRole(currentUser, "Administrateur"),
      isManager: hasAnyUserRole(currentUser, ["Gestionnaire", "Gestionnaire Budgetaire"]),
      isBudgetManager,
      isProjectManager,
      isComptable,
      async login(email: string, password: string) {
        try {
          const response = await authService.login(email, password);
          const enrichedUser = enrichUserWithTemporaryDepartment(response.user);
          localStorage.setItem("budget_access_token", response.access_token);
          localStorage.setItem("budget_admin_user", JSON.stringify(enrichedUser));
          setCurrentUser(enrichedUser);
          return enrichedUser;
        } catch (error) {
          throw new Error(getApiErrorMessage(error), { cause: error });
        }
      },
      logout() {
        localStorage.removeItem("budget_access_token");
        localStorage.removeItem("budget_admin_user");
        setCurrentUser(null);
      },
    }),
    [authLoading, currentUser, isBudgetManager, isComptable, isProjectManager],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider");
  }
  return context;
}
