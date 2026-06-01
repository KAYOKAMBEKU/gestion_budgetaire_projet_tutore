import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const links = [
  { to: "/comptable/dashboard", label: "Tableau de bord", description: "Synthese execution" },
  { to: "/comptable/budgets", label: "Budgets en execution", description: "Budgets approuves" },
  { to: "/comptable/mouvements", label: "Mouvements financiers", description: "Entrees et sorties" },
  { to: "/comptable/realisations", label: "Realisations budgetaires", description: "Budget realise" },
  { to: "/comptable/analyse-ecarts", label: "Analyse des ecarts", description: "Prevu vs realise" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-4 py-3 text-left transition ${
    isActive ? "bg-white/20 text-white shadow-sm" : "text-[#DCEAF3] hover:bg-[#145174] hover:text-white"
  }`;

export function ComptableSidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <aside className="flex h-screen flex-col border-r border-[#E5E7EB] bg-[#0F3D5E] p-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:border-b-0">
        <div className="shrink-0 border-b border-white/10 px-1 pb-4 text-white">
          <h1 className="text-lg font-bold">Bienvenue Comptable</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#DCEAF3]/70">Execution budgetaire</p>
        </div>
        <nav className="admin-sidebar-scroll mt-5 grid flex-1 content-start gap-2 overflow-y-auto pr-1">
          {links.map((link) => (
            <NavLink
              className={linkClass}
              key={link.to}
              to={link.to}
            >
              <span className="block text-sm font-semibold">{link.label}</span>
              <span className="mt-0.5 block text-xs text-[#DCEAF3]/70">{link.description}</span>
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/10 bg-[#0F3D5E] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#DCEAF3]/70">Connecte</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{currentUser?.email}</p>
          <button className="mt-3 w-full rounded-md border border-[#FCA5A5]/60 bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#991B1B]" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>
      </aside>
      <div aria-hidden="true" className="hidden lg:block lg:w-72 lg:shrink-0" />
    </>
  );
}
