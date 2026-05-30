import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export type AdminSectionId = "dashboard" | "users" | "departements" | "exercices" | "budgetValidation" | "approvedBudgets" | "budgetReports";

const menuItems: { id: AdminSectionId; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Vue d'ensemble" },
  { id: "users", label: "Utilisateurs", description: "Comptes, roles, permissions" },
  { id: "departements", label: "Departements", description: "Structure interne" },
];

const budgetMenuItems: { id: AdminSectionId; label: string; description: string }[] = [
  { id: "exercices", label: "Exercices budgetaires", description: "Ouverture et cloture" },
  { id: "budgetValidation", label: "Budgets a approuver", description: "Decision finale" },
  { id: "approvedBudgets", label: "Budgets approuves", description: "Execution possible" },
  { id: "budgetReports", label: "Rapports budgetaires", description: "Synthese" },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface AdminSidebarProps {
  activeSection: AdminSectionId;
  onChange: (section: AdminSectionId) => void;
}

export function AdminSidebar({ activeSection, onChange }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const budgetMenuActive = budgetMenuItems.some((item) => item.id === activeSection);
  const [budgetOpen, setBudgetOpen] = useState(budgetMenuActive);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <aside className="flex h-screen flex-col border-r border-[#E5E7EB] bg-[#0F3D5E] p-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:border-b-0">
        <div className="shrink-0 border-b border-white/10 px-1 pb-4 text-white">
          <h1 className="text-lg font-bold">Bienvenue Administrateur</h1>
        </div>
        <nav className="admin-sidebar-scroll mt-5 grid flex-1 content-start gap-2 overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <button
              className={`rounded-lg px-4 py-3 text-left transition ${
                activeSection === item.id ? "bg-white/20 text-white shadow-sm" : "text-[#DCEAF3] hover:bg-[#145174] hover:text-white"
              }`}
              key={item.id}
              onClick={() => onChange(item.id)}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className={`mt-0.5 block text-xs ${activeSection === item.id ? "text-white/80" : "text-[#DCEAF3]/70"}`}>{item.description}</span>
            </button>
          ))}

          <div className="rounded-lg border border-white/10">
            <button
              className={`w-full rounded-lg px-4 py-3 text-left transition ${
                budgetMenuActive ? "bg-white/20 text-white shadow-sm" : "text-[#DCEAF3] hover:bg-[#145174] hover:text-white"
              }`}
              onClick={() => setBudgetOpen((open) => !open)}
              type="button"
            >
              <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                Budget
                <span className={`grid h-7 w-7 place-items-center rounded-full ${budgetMenuActive ? "bg-white/20 text-white" : "bg-white/10 text-[#DCEAF3]"}`}>
                  <ChevronIcon open={budgetOpen} />
                </span>
              </span>
              <span className={`mt-0.5 block text-xs ${budgetMenuActive ? "text-white/80" : "text-[#DCEAF3]/70"}`}>Exercices, approbations et rapports</span>
            </button>
            {budgetOpen ? (
              <div className="budget-submenu-scroll grid gap-1 border-t border-white/10 p-2 pr-1">
                {budgetMenuItems.map((item) => (
                  <button
                    className={`rounded-md px-3 py-2 text-left transition ${
                      activeSection === item.id ? "bg-white/20 text-white" : "text-[#DCEAF3] hover:bg-[#145174] hover:text-white"
                    }`}
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-[#DCEAF3]/70">{item.description}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
        <div className="shrink-0 border-t border-white/10 bg-[#0F3D5E] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#DCEAF3]/70">Connecte</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{currentUser?.email}</p>
          <button
            className="mt-3 w-full rounded-md border border-[#FCA5A5]/60 bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#991B1B]"
            onClick={handleLogout}
          >
            Deconnexion
          </button>
        </div>
      </aside>
      <div aria-hidden="true" className="hidden lg:block lg:w-72 lg:shrink-0" />
    </>
  );
}
