import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import type { AuthUser } from "../../../types/auth";

function getHomePathForUser(user: AuthUser | null) {
  if (user?.roles.includes("Administrateur")) {
    return "/administration";
  }
  if (user?.roles.includes("Gestionnaire") || user?.roles.includes("Gestionnaire Budgetaire")) {
    return "/manager";
  }
  if (user?.roles.includes("Chef de projet")) {
  return "/chef/projets";
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
      setError(loginError instanceof Error ? loginError.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Gestion budgetaire</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Connexion</h1>
          <p className="mt-2 text-sm text-slate-600">Connectez-vous pour acceder a votre espace selon votre role.</p>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Mot de passe
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500"
              minLength={6}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
          <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Admin: admin@example.com / Admin12345</p>
        <p className="mt-1 text-xs text-slate-500">Gestionnaire: gestionnaire.finance@example.com / Gestionnaire123</p>
      </section>
    </main>
  );
}
