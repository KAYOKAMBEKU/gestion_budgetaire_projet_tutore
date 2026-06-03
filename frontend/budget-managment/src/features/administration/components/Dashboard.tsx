import { useQuery } from "@tanstack/react-query";
import { budgetAnalyticsService } from "../../../services/budgetAnalyticsService";
import { useDepartements } from "../hooks/useDepartements";
import { useActiveExerciceBudgetaire, useExercicesBudgetaires } from "../hooks/useExercicesBudgetaires";
import { useRoles } from "../hooks/useRoles";
import { useUsers } from "../hooks/useUsers";
import { StatusBadge } from "./StatusBadge";
import { formatCurrencyTotals, getBudgetRiskAlerts, groupBudgetTotalsByCurrency, type CurrencyTotals } from "../../manager/utils/budgetCurrency";
import { formatAmount } from "../../manager/utils/formatAmount";
import { formatDateRange } from "../../../utils/formatDate";

interface StatusChartItem {
  label: string;
  value: number;
  color: string;
  textColor: string;
}

function BudgetStatusChart({ items }: { items: StatusChartItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1F2937]">Repartition des budgets</p>
          <p className="mt-1 text-xs text-[#6B7280]">Attente d'approbation, approbation et rejet.</p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Statuts</p>
      </div>
      <div className="mt-5 grid h-64 grid-cols-3 items-end gap-4 border-b border-l border-[#1F2937]/50 px-3 pb-3">
        {items.map((item) => {
          const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 2);
          return (
            <div className="flex h-full min-w-0 flex-col justify-end gap-3" key={item.label}>
              <div className="text-center">
                <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
              </div>
              <div className="flex h-44 items-end">
                <div
                  aria-label={`${item.label}: ${item.value}`}
                  className={`w-full rounded-t-md ${item.color}`}
                  role="img"
                  style={{ height: `${height}%` }}
                />
              </div>
              <p className="min-h-10 text-center text-xs font-semibold leading-5 text-[#4B5563]">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrencyGapChart({ totals }: { totals: CurrencyTotals[] }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1F2937]">Ecarts par devise</p>
          <p className="mt-1 text-xs text-[#6B7280]">Les budgets FC et USD sont calcules separement.</p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">FC / USD</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {totals.map((total) => {
          const ecart = total.realise - total.prevu;
          const taux = total.prevu > 0 ? (total.realise / total.prevu) * 100 : 0;
          return (
            <div className="rounded-md border border-[#1F2937]/20 bg-white/30 px-4 py-3" key={total.currency}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#1F2937]">{total.currency}</p>
                <p className={`text-sm font-bold ${ecart > 0 ? "text-[#B91C1C]" : "text-[#1F8A5B]"}`}>{taux.toFixed(2)}%</p>
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                <p className="font-semibold text-[#6B7280]">Prevu: <span className="text-[#1F2937]">{formatAmount(total.prevu, total.currency)}</span></p>
                <p className="font-semibold text-[#6B7280]">Realise: <span className="text-[#1F2937]">{formatAmount(total.realise, total.currency)}</span></p>
                <p className="font-semibold text-[#6B7280]">Ecart: <span className={ecart > 0 ? "text-[#B91C1C]" : "text-[#1F8A5B]"}>{formatAmount(ecart, total.currency)}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BudgetRiskPanel({ totals, alerts }: { totals: CurrencyTotals[]; alerts: ReturnType<typeof getBudgetRiskAlerts> }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1F2937]">Alertes budgetaires</p>
          <p className="mt-1 text-xs text-[#6B7280]">Signalement des budgets a 90% ou plus des depenses prevues.</p>
        </div>
        <p className="text-sm font-bold text-[#B45309]">{alerts.length}</p>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-md bg-[#F9FAFB] px-3 py-2 text-xs font-semibold text-[#6B7280]">
          Synthese: {formatCurrencyTotals(totals, (total) => total.realise)} realise / {formatCurrencyTotals(totals, (total) => total.prevu)} prevu
        </div>
        {alerts.length === 0 ? (
          <p className="rounded-lg bg-[#DCFCE7] px-4 py-3 text-sm font-medium text-[#16A34A]">Aucun budget en grand risque de depassement.</p>
        ) : alerts.slice(0, 5).map((alert) => (
          <div className={`rounded-lg border px-4 py-3 text-sm ${alert.level === "danger" ? "border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]" : "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]"}`} key={alert.budgetId}>
            <p className="font-bold">{alert.label}</p>
            <p className="mt-1 font-semibold">{alert.taux.toFixed(2)}% execute - {formatAmount(alert.realise, alert.currency)} sur {formatAmount(alert.prevu, alert.currency)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GlobalTotalsChart({ budgetsCount, currency, isLoading, totalPrevu, totalRealise }: { budgetsCount: number; currency: CurrencyTotals["currency"]; isLoading: boolean; totalPrevu: number; totalRealise: number }) {
  const maxValue = Math.max(totalPrevu, totalRealise, 1);
  const progress = Math.min((totalRealise / maxValue) * 100, 100);
  const dataStatus = isLoading ? "Chargement" : budgetsCount > 0 ? "Disponible" : "Vide";

  return (
    <div className="card">
      <div>
        <p className="text-sm font-semibold text-[#1F2937]">Vue globale des donnees</p>
        <p className="mt-1 text-xs text-[#6B7280]">Previsionnel, realise et disponibilite des donnees en {currency}.</p>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_140px] lg:items-center">
        <div className="grid gap-4">
          {[
            { label: "Total Previsionnel Global", value: totalPrevu, color: "bg-[#0F3D5E]" },
            { label: "Total Realise Global", value: totalRealise, color: "bg-[#1F8A5B]" },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{item.label}</p>
                <p className="text-sm font-bold text-[#1F2937]">{formatAmount(item.value, currency)}</p>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid aspect-square place-items-center rounded-full border-[12px] border-[#1F2937]/50 bg-white/30 text-center shadow-sm">
          <div>
            <p className="text-2xl font-bold text-[#0F3D5E]">{Math.round(progress)}%</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{dataStatus}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{isLoading ? "Budgets..." : `${budgetsCount} budget(s)`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const usersQuery = useUsers();
  const rolesQuery = useRoles();
  const departementsQuery = useDepartements();
  const exercicesQuery = useExercicesBudgetaires();
  const activeExerciceQuery = useActiveExerciceBudgetaire();
  const budgetsQuery = useQuery({
    queryKey: ["admin", "dashboard-budgets"],
    queryFn: () => budgetAnalyticsService.getBudgetsByStatuses(),
  });
  const budgets = budgetsQuery.data ?? [];
  const totalsByCurrency = groupBudgetTotalsByCurrency(budgets);
  const riskAlerts = getBudgetRiskAlerts(budgets);
  const countByStatus = (statuses: string[]) => budgets.filter((budget) => statuses.includes(budget.statut)).length;
  const statusChartItems: StatusChartItem[] = [
    {
      label: "Budget en attente d'approbation",
      value: countByStatus(["soumis_admin"]),
      color: "bg-[#D97706]",
      textColor: "text-[#B45309]",
    },
    {
      label: "Budgets approuves",
      value: countByStatus(["approuve_admin", "en_execution", "execute", "cloture"]),
      color: "bg-[#1F8A5B]",
      textColor: "text-[#1F8A5B]",
    },
    {
      label: "Budgets rejetes",
      value: countByStatus(["rejete", "rejete_admin", "rejete_gestionnaire"]),
      color: "bg-[#B91C1C]",
      textColor: "text-[#B91C1C]",
    },
  ];

  const stats = [
    { label: "Utilisateurs", value: usersQuery.data?.length ?? 0 },
    { label: "Roles", value: rolesQuery.data?.length ?? 0 },
    { label: "Departements", value: departementsQuery.data?.length ?? 0 },
    { label: "Exercices", value: exercicesQuery.data?.length ?? 0 },
  ];

  return (
    <div className="grid gap-5 text-left">
      <div>
        <h2 className="text-xl font-bold text-[#1F2937]">Dashboard</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Synthese rapide de l'espace administrateur.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div className="card stat-card" key={stat.label}>
            <p className="text-sm font-medium text-[#6B7280]">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-[#1F2937]">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <p className="text-sm font-semibold text-[#6B7280]">Exercice actif</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">{activeExerciceQuery.data?.libelle ?? "Aucun exercice ouvert"}</h3>
            {activeExerciceQuery.data ? (
              <p className="mt-1 text-sm text-[#6B7280]">
                {formatDateRange(activeExerciceQuery.data.date_debut, activeExerciceQuery.data.date_fin)}
              </p>
            ) : null}
          </div>
          {activeExerciceQuery.data ? <StatusBadge status={activeExerciceQuery.data.statut} /> : null}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <BudgetStatusChart items={statusChartItems} />
        <CurrencyGapChart totals={totalsByCurrency} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {totalsByCurrency.map((total) => (
          <GlobalTotalsChart budgetsCount={total.count} currency={total.currency} isLoading={budgetsQuery.isLoading} key={total.currency} totalPrevu={total.prevu} totalRealise={total.realise} />
        ))}
      </div>
      <BudgetRiskPanel alerts={riskAlerts} totals={totalsByCurrency} />
    </div>
  );
}
