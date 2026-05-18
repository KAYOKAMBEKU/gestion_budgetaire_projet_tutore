export type AdminSectionId = "dashboard" | "users" | "departements" | "exercices" | "budgetValidation";

const menuItems: { id: AdminSectionId; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Vue d'ensemble" },
  { id: "users", label: "Utilisateurs", description: "Comptes, roles, permissions" },
  { id: "budgetValidation", label: "Budgets soumis", description: "Validation par departement" },
  { id: "departements", label: "Departements", description: "Structure interne" },
  { id: "exercices", label: "Exercices", description: "Annees budgetaires" },
];

interface AdminSidebarProps {
  activeSection: AdminSectionId;
  onChange: (section: AdminSectionId) => void;
}

export function AdminSidebar({ activeSection, onChange }: AdminSidebarProps) {
  return (
    <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="rounded-lg bg-slate-950 px-4 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Administration</p>
        <h1 className="mt-1 text-lg font-bold">Gestion budgetaire</h1>
      </div>
      <nav className="mt-5 grid gap-2">
        {menuItems.map((item) => (
          <button
            className={`rounded-lg px-4 py-3 text-left transition ${
              activeSection === item.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            key={item.id}
            onClick={() => onChange(item.id)}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className={`mt-0.5 block text-xs ${activeSection === item.id ? "text-slate-300" : "text-slate-500"}`}>{item.description}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
