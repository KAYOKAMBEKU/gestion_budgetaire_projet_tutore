export type AdminTabId = "users" | "roles" | "permissions";

const adminTabs: { id: AdminTabId; label: string }[] = [
  { id: "users", label: "Utilisateurs" },
  { id: "roles", label: "Roles" },
  { id: "permissions", label: "Permissions" },
];

interface AdminTabsProps {
  activeTab: AdminTabId;
  onChange: (tab: AdminTabId) => void;
}

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      {adminTabs.map((tab) => (
        <button
          className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
            activeTab === tab.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
