import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export function ManagerSidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="rounded-lg bg-emerald-700 px-4 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Espace gestionnaire</p>
        <h1 className="mt-1 text-lg font-bold">Budgets departementaux</h1>
      </div>
      <nav className="mt-5 grid gap-2">
        <NavLink
          className={({ isActive }) =>
            `rounded-lg px-4 py-3 text-left transition ${
              isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`
          }
          to="/manager/budgets/create"
        >
          <span className="block text-sm font-semibold">Creation du budget</span>
          <span className="mt-0.5 block text-xs text-inherit opacity-75">Soumettre pour validation</span>
        </NavLink>
      </nav>
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connecte</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-950">{currentUser?.email}</p>
        <button className="mt-4 w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={handleLogout}>
          Deconnexion
        </button>
      </div>
    </aside>
  );
}
