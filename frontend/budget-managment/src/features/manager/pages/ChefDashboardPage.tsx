import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { budgetService } from "../../../services/budgetService";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { useChefProjects } from "../hooks/useManagerProjects";
import { formatCurrencyTotals, getBudgetRiskAlerts, groupBudgetTotalsByCurrency } from "../utils/budgetCurrency";
import { formatAmount } from "../utils/formatAmount";

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

export function ChefDashboardPage() {
  const { authLoading, currentUser, isAuthenticated, isProjectManager } = useAuth();
  const projectsQuery = useChefProjects(currentUser?.id);
  const budgetsQuery = useQuery({
    queryKey: ["chef", "dashboard-budgets", currentUser?.id, projectsQuery.data?.map((project) => project.id)],
    enabled: Boolean(currentUser?.id) && Boolean(projectsQuery.data),
    queryFn: async () => {
      const budgetsByProject = await Promise.all((projectsQuery.data ?? []).map((project) => budgetService.getBudgetsByProjet(project.id)));
      return budgetsByProject.flat();
    },
  });

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isProjectManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Chef de projet." title="Acces refuse" />;
  }

  const projects = projectsQuery.data ?? [];
  const budgets = budgetsQuery.data ?? [];
  const totalsByCurrency = groupBudgetTotalsByCurrency(budgets);
  const riskAlerts = getBudgetRiskAlerts(budgets);
  const countByStatus = (statuses: string[]) => budgets.filter((budget) => statuses.includes(budget.statut)).length;

  const stats = [
    { label: "Projets", value: projects.length, bg: "bg-[#F9FAFB]", text: "text-[#1F2937]" },
    { label: "Budgets brouillon", value: countByStatus(["brouillon"]), bg: "bg-[#F3F4F6]", text: "text-[#6B7280]" },
    { label: "Budgets soumis", value: countByStatus(["soumis", "soumis_gestionnaire", "valide_gestionnaire", "soumis_admin"]), bg: "bg-[#FEF3C7]", text: "text-[#B45309]" },
    { label: "Budgets rejetes", value: countByStatus(["rejete", "rejete_gestionnaire", "rejete_admin"]), bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]" },
    { label: "Budgets approuves", value: countByStatus(["approuve_admin", "en_execution", "execute", "cloture"]), bg: "bg-[#DCFCE7]", text: "text-[#15803D]" },
  ];

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1F8A5B]">Espace chef de projet</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Tableau de bord</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Synthese de vos projets, budgets previsionnels et realisations en lecture seule.</p>
          </header>

          {projectsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(projectsQuery.error)}</div> : null}
          {budgetsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(budgetsQuery.error)}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <div className={`rounded-lg p-5 shadow-sm ring-1 ring-[#E5E7EB] ${stat.bg}`} key={stat.label}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${stat.text} opacity-75`}>{stat.label}</p>
                <p className={`mt-3 text-3xl font-bold ${stat.text}`}>{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="card grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget previsionnel total</p>
              <p className="mt-2 text-xl font-bold text-[#1F2937]">{formatCurrencyTotals(totalsByCurrency, (total) => total.prevu)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget realise</p>
              <p className="mt-2 text-xl font-bold text-[#2563EB]">{formatCurrencyTotals(totalsByCurrency, (total) => total.realise)}</p>
              <p className="mt-1 text-xs text-[#6B7280]">Lecture seule, calcule depuis les mouvements comptables.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Ecart global</p>
              <p className="mt-2 text-xl font-bold text-[#1F2937]">{formatCurrencyTotals(totalsByCurrency, (total) => total.realise - total.prevu)}</p>
            </div>
          </section>

          <section className="rounded-lg border border-[#FDE68A] bg-white p-6 text-left shadow-sm">
            <h2 className="text-lg font-bold text-[#1F2937]">Alertes de depassement</h2>
            <div className="mt-4 grid gap-3">
              {riskAlerts.length === 0 ? (
                <p className="rounded-lg bg-[#DCFCE7] px-4 py-3 text-sm font-medium text-[#16A34A]">Aucun budget en grand risque de depassement.</p>
              ) : riskAlerts.slice(0, 5).map((alert) => (
                <div className={`rounded-lg border px-4 py-3 text-sm ${alert.level === "danger" ? "border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]" : "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]"}`} key={alert.budgetId}>
                  <p className="font-bold">{alert.label}</p>
                  <p className="mt-1 font-semibold">{alert.taux.toFixed(2)}% execute - {formatAmount(alert.realise, alert.currency)} sur {formatAmount(alert.prevu, alert.currency)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Budgets recents</h2>
                <p className="mt-1 text-sm text-[#6B7280]">Budget previsionnel cree par vous, budget realise calcule automatiquement.</p>
              </div>
              <Link className="btn-primary rounded-md px-4 py-2 text-sm font-semibold" to="/chef/budgets">
                Creer un budget
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
