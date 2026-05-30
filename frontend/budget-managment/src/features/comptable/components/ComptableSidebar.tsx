import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const links = [
  { to: "/comptable/dashboard", label: "Tableau de bord", description: "Synthese execution" },
  { to: "/comptable/budgets", label: "Budgets en execution", description: "Budgets approuves" },
  { to: "/comptable/entrees", label: "Entrees financieres", description: "Argent recu" },
  { to: "/comptable/sorties", label: "Sorties financieres", description: "Depenses reelles" },
  { to: "/comptable/realisations", label: "Realisations budgetaires", description: "Budget realise" },
  { to: "/comptable/analyse-ecarts", label: "Analyse des ecarts", description: "Prevu vs realise" },
];

export function ComptableSidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <aside className="border-r border-[#E5E7EB] bg-[#0F3D5E] p-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:h-screen lg:w-72 lg:overflow-y-auto lg:border-b-0">
        <div className="rounded-lg bg-[#3B82F6] px-4 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Espace comptable</p>
          <h1 className="mt-1 text-lg font-bold">Execution budgetaire</h1>
        </div>
        <nav className="mt-5 grid gap-2">
          {links.map((link) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 text-left transition ${
                  isActive ? "bg-[#1F8A5B] text-white shadow-sm" : "text-[#DCEAF3] hover:bg-[#145174] hover:text-white"
                }`
              }
              key={link.to}
              to={link.to}
            >
              <span className="block text-sm font-semibold">{link.label}</span>
              <span className="mt-0.5 block text-xs text-inherit opacity-75">{link.description}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#DCEAF3]/70">Connecte</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{currentUser?.email}</p>
          <button className="btn-outline mt-4 w-full rounded-md text-sm border-white/30 text-white hover:bg-white hover:text-[#0F3D5E]" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>
      </aside>
      <div aria-hidden="true" className="hidden lg:block lg:w-72 lg:shrink-0" />
    </>
  );
}
