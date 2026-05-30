import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { Toast } from "../../administration/components/Toast";
import { useBudgetsByProjects } from "../hooks/useManagerBudget";
import { useChefProjects } from "../hooks/useManagerProjects";
import type { BudgetStatus } from "../../../types/budget";

const labels: Record<BudgetStatus, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  soumis_gestionnaire: "Soumis au Gestionnaire",
  valide: "Valide",
  valide_gestionnaire: "Valide par le Gestionnaire",
  soumis_admin: "Soumis a l'Administrateur",
  approuve_admin: "Approuve par l'Administrateur",
  rejete: "Rejete",
  rejete_gestionnaire: "Rejete par le Gestionnaire",
  rejete_admin: "Rejete par l'Administrateur",
  en_execution: "En execution",
  execute: "Execute",
  cloture: "Cloture",
};

const tones: Record<BudgetStatus, string> = {
  brouillon: "bg-[#F4F7FA] text-[#374151] ring-[#E5E7EB]",
  soumis: "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  soumis_gestionnaire: "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  valide: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  valide_gestionnaire: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  soumis_admin: "bg-[#EDE9FE] text-[#7C3AED] ring-[#DDD6FE]",
  approuve_admin: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  rejete: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  rejete_gestionnaire: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  rejete_admin: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  en_execution: "bg-[#DBEAFE] text-[#2563EB] ring-blue-200",
  execute: "bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]",
  cloture: "bg-[#F4F7FA] text-[#374151] ring-[#E5E7EB]",
};

function AccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F7FA] p-6">
      <div className="max-w-lg rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
        <h1 className="text-xl font-bold text-[#1F2937]">{title}</h1>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
      </div>
    </main>
  );
}

export function ChefSubmissionsPage() {
  const { authLoading, currentUser, isAuthenticated, isProjectManager } = useAuth();
  const projectsQuery = useChefProjects(currentUser?.id);
  const projectIds = (projectsQuery.data ?? []).map((project) => project.id);
  const budgetsQuery = useBudgetsByProjects(projectIds);

  const projectTitles = new Map((projectsQuery.data ?? []).map((project) => [project.id, `${project.code} - ${project.titre}`]));

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isProjectManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Chef de projet." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Espace Chef de projet</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Soumissions</h1>
          </header>

          {projectsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(projectsQuery.error)}</div> : null}
          {budgetsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(budgetsQuery.error)}</div> : null}

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#374151]">Reference</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Budget</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Projet</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Statut</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsQuery.isLoading || budgetsQuery.isLoading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={5}>Chargement...</td>
                    </tr>
                  ) : (budgetsQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={5}>Aucune soumission budgetaire.</td>
                    </tr>
                  ) : (
                    (budgetsQuery.data ?? []).map((budget) => (
                      <tr key={budget.id} className="border-b border-[#E5E7EB] hover:bg-[#F4F7FA]">
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">{budget.reference}</td>
                        <td className="px-4 py-3 text-[#374151]">{budget.libelle}</td>
                        <td className="px-4 py-3 text-[#374151]">{budget.projet_id ? projectTitles.get(budget.projet_id) ?? budget.projet_id : "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[budget.statut]}`}>{labels[budget.statut]}</span>
                        </td>
                        <td className="px-4 py-3">
                          {["brouillon", "rejete", "rejete_gestionnaire", "rejete_admin"].includes(budget.statut) ? (
                            <Link className="font-semibold text-[#15803D] hover:text-[#15803D]" to={`/chef/budgets?projectId=${budget.projet_id ?? ""}`}>
                              Corriger
                            </Link>
                          ) : (
                            <span className="text-slate-400">Verrouille</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      <Toast />
    </main>
  );
}
