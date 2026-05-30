import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { budgetAnalyticsService } from "../../../services/budgetAnalyticsService";
import { formatAmount } from "../../manager/utils/formatAmount";
import { ComptableSidebar } from "../components/ComptableSidebar";
import { useExecutableBudgets } from "../hooks/useComptableBudget";

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

export function ComptableDashboardPage() {
  const { authLoading, isAuthenticated, isComptable } = useAuth();
  const budgetsQuery = useExecutableBudgets();
  const executableBudgets = (budgetsQuery.data ?? []).filter((budget) => budget.statut === "en_execution");
  const executionsQuery = useQuery({
    queryKey: ["comptable", "dashboard-executions", executableBudgets.map((budget) => budget.id)],
    enabled: executableBudgets.length > 0,
    queryFn: () => budgetAnalyticsService.getExecutionByBudgetIds(executableBudgets.map((budget) => budget.id)),
  });
  const executions = Object.values(executionsQuery.data ?? {});
  const totalEntrees = executions.reduce((sum, execution) => sum + Number(execution.total_recettes_realisees ?? 0), 0);
  const totalSorties = executions.reduce((sum, execution) => sum + Number(execution.total_depenses_realisees ?? 0), 0);
  const mouvements = executions.flatMap((execution) => execution.mouvements_financiers ?? []).sort((a, b) => b.date_mouvement.localeCompare(a.date_mouvement)).slice(0, 6);
  const nearOverspend = executions.filter((execution) => Number(execution.taux_execution_depenses ?? 0) >= 90);

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isComptable) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Comptable." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ComptableSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#3B82F6]">Espace comptable</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Tableau de bord</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Suivi des budgets en execution et des mouvements financiers reels.</p>
          </header>

          {budgetsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(budgetsQuery.error)}</div> : null}
          {executionsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(executionsQuery.error)}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg bg-[#DBEAFE] p-5 shadow-sm ring-1 ring-[#BFDBFE]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Budgets en execution</p>
              <p className="mt-3 text-3xl font-bold text-[#1D4ED8]">{executableBudgets.length}</p>
            </div>
            <div className="rounded-lg bg-[#DCFCE7] p-5 shadow-sm ring-1 ring-[#BBF7D0]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#16A34A]">Entrees reelles</p>
              <p className="mt-3 text-xl font-bold text-[#15803D]">{formatAmount(totalEntrees)}</p>
            </div>
            <div className="rounded-lg bg-[#FEE2E2] p-5 shadow-sm ring-1 ring-[#FECACA]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#DC2626]">Sorties reelles</p>
              <p className="mt-3 text-xl font-bold text-[#B91C1C]">{formatAmount(totalSorties)}</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Solde realise</p>
              <p className="mt-3 text-xl font-bold text-[#1F2937]">{formatAmount(totalEntrees - totalSorties)}</p>
            </div>
            <div className="rounded-lg bg-[#FEF3C7] p-5 shadow-sm ring-1 ring-[#FDE68A]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#D97706]">Proches depassement</p>
              <p className="mt-3 text-3xl font-bold text-[#B45309]">{nearOverspend.length}</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-lg font-bold text-[#1F2937]">Mouvements recents</h2>
                <div className="flex gap-2">
                  <Link className="btn-success rounded-md px-3 py-2 text-sm font-semibold" to="/comptable/entrees">Entree</Link>
                  <Link className="btn-danger rounded-md px-3 py-2 text-sm font-semibold" to="/comptable/sorties">Sortie</Link>
                </div>
              </div>
              <div className="mt-4 overflow-hidden border border-[#E5E7EB]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F9FAFB]">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Date</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Type</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Libelle</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mouvements.length === 0 ? (
                        <tr><td className="px-4 py-8 text-center text-[#6B7280]" colSpan={4}>Aucun mouvement recent.</td></tr>
                      ) : mouvements.map((mouvement) => (
                        <tr className="border-b border-[#E5E7EB] hover:bg-[#F4F7FA]" key={mouvement.id}>
                          <td className="px-4 py-3 text-[#6B7280]">{mouvement.date_mouvement}</td>
                          <td className="px-4 py-3 capitalize text-[#6B7280]">{mouvement.type_mouvement}</td>
                          <td className="px-4 py-3 font-semibold text-[#1F2937]">{mouvement.libelle}</td>
                          <td className="px-4 py-3 font-bold text-[#1F2937]">{formatAmount(mouvement.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-lg font-bold text-[#1F2937]">Alertes budgetaires</h2>
              <div className="mt-4 grid gap-3">
                {nearOverspend.length === 0 ? (
                  <p className="rounded-lg bg-[#DCFCE7] px-4 py-3 text-sm font-medium text-[#16A34A]">Aucun budget proche du depassement.</p>
                ) : nearOverspend.map((execution) => (
                  <Link className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-sm font-semibold text-[#92400E]" key={execution.budget_id} to={`/comptable/budgets/${execution.budget_id}`}>
                    Budget {execution.budget_id} : {Number(execution.taux_execution_depenses ?? 0).toFixed(2)}% execute
                  </Link>
                ))}
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
