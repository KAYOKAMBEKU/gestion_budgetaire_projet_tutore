import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { budgetAnalyticsService } from "../../../services/budgetAnalyticsService";
import { formatDate } from "../../../utils/formatDate";
import { formatCurrencyTotals, getExecutionRiskAlerts, emptyCurrencyTotals, currencies } from "../../manager/utils/budgetCurrency";
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
  const totalsByCurrency = currencies.map((currency) => {
    const total = emptyCurrencyTotals(currency);
    for (const execution of executions) {
      if ((execution.devise === "USD" ? "USD" : "FC") !== currency) {
        continue;
      }
      total.count += 1;
      total.recettesRealisees += Number(execution.total_recettes_realisees ?? 0);
      total.depensesRealisees += Number(execution.total_depenses_realisees ?? 0);
      total.realise += Number(execution.montant_realise_total ?? 0);
      total.prevu += Number(execution.budget_previsionnel ?? 0);
    }
    return total;
  });
  const mouvements = executions.flatMap((execution) => execution.mouvements_financiers ?? []).sort((a, b) => b.date_mouvement.localeCompare(a.date_mouvement)).slice(0, 6);
  const nearOverspend = getExecutionRiskAlerts(executions);

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
            <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Espace comptable</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Tableau de bord</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Suivi des budgets en execution et des mouvements financiers reels.</p>
          </header>

          {budgetsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(budgetsQuery.error)}</div> : null}
          {executionsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(executionsQuery.error)}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budgets en execution</p>
              <p className="mt-3 text-3xl font-bold text-[#1F2937]">{executableBudgets.length}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Entrees reelles</p>
              <p className="mt-3 text-xl font-bold text-[#1F2937]">{formatCurrencyTotals(totalsByCurrency, (total) => total.recettesRealisees)}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Sorties reelles</p>
              <p className="mt-3 text-xl font-bold text-[#1F2937]">{formatCurrencyTotals(totalsByCurrency, (total) => total.depensesRealisees)}</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Solde realise</p>
              <p className="mt-3 text-xl font-bold text-[#1F2937]">{formatCurrencyTotals(totalsByCurrency, (total) => total.recettesRealisees - total.depensesRealisees)}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Proches depassement</p>
              <p className="mt-3 text-3xl font-bold text-[#1F2937]">{nearOverspend.length}</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-lg font-bold text-[#1F2937]">Mouvements recents</h2>
                <div className="flex gap-2">
                  <Link className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#F4F7FA]" to="/comptable/mouvements">Voir tout</Link>
                  <Link className="btn-primary rounded-md px-3 py-2 text-sm font-semibold" to="/comptable/budgets">Executer</Link>
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
                          <td className="px-4 py-3 text-[#6B7280]">{formatDate(mouvement.date_mouvement)}</td>
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
                ) : nearOverspend.map((alert) => (
                  <Link className={`rounded-lg border px-4 py-3 text-sm font-semibold ${alert.level === "danger" ? "border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]" : "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]"}`} key={alert.budgetId} to={`/comptable/budgets/${alert.budgetId}`}>
                    {alert.label} : {alert.taux.toFixed(2)}% execute, {formatAmount(alert.realise, alert.currency)} sur {formatAmount(alert.prevu, alert.currency)}
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
