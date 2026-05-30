import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import type { AuthUser } from "../../../types/auth";
import { hasAnyUserRole, hasUserRole } from "../../../utils/authRoles";

function getHomePathForUser(user: AuthUser | null) {
  if (hasUserRole(user, "Administrateur")) {
    return "/administration";
  }
  if (hasAnyUserRole(user, ["Gestionnaire", "Gestionnaire Budgetaire"])) {
    return "/manager/budgets";
  }
  if (hasUserRole(user, "Chef de projet")) {
    return "/chef/dashboard";
  }
  if (hasUserRole(user, "Comptable")) {
    return "/comptable/dashboard";
  }
  return "/login";
}

export function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate replace to={getHomePathForUser(currentUser)} />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(getHomePathForUser(user), { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Connexion impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F7FA] px-4 py-10">
      <section className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
        <div>
          <div className="rounded-lg bg-[#0F3D5E] px-4 py-3 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#DCEAF3]">Gestion budgetaire</p>
            <h1 className="mt-1 text-xl font-bold">Connexion</h1>
          </div>
          <p className="mt-4 text-sm text-[#6B7280]">
            Connectez-vous pour acceder a votre espace selon votre role.
          </p>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-[#374151]">
            Email
            <input
              className="input-field"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-[#374151]">
            Mot de passe
            <input
              className="input-field"
              minLength={6}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? (
            <p className="rounded-md bg-[#FEE2E2] px-3 py-2 text-sm font-medium text-[#DC2626]">
              {error}
            </p>
          ) : null}
          <button
            className="btn-primary rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-xs text-[#6B7280]">
          Admin: admin@example.com / Admin12345
        </p>
        <p className="mt-1 text-xs text-[#6B7280]">
          Gestionnaire: gestionnaire.finance@example.com / Gestionnaire123
        </p>
      </section>
    </main>
  );
}
