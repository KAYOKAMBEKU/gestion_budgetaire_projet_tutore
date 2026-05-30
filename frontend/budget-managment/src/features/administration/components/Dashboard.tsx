import { useQuery } from "@tanstack/react-query";
import { budgetAnalyticsService } from "../../../services/budgetAnalyticsService";
import { useDepartements } from "../hooks/useDepartements";
import { useActiveExerciceBudgetaire, useExercicesBudgetaires } from "../hooks/useExercicesBudgetaires";
import { useRoles } from "../hooks/useRoles";
import { useUsers } from "../hooks/useUsers";
import { StatusBadge } from "./StatusBadge";
import { formatAmount } from "../../manager/utils/formatAmount";

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

function GlobalGapChart({ totalPrevu, totalRealise }: { totalPrevu: number; totalRealise: number }) {
  const ecart = totalRealise - totalPrevu;
  const base = Math.max(Math.abs(totalPrevu), Math.abs(totalRealise), Math.abs(ecart), 1);
  const center = 110;
  const pointX = (value: number) => 24 + (Math.abs(value) / base) * 252;
  const points = [
    { x: 24, y: 150, label: "Prevu", value: totalPrevu },
    { x: pointX(totalRealise), y: 78, label: "Realise", value: totalRealise },
    { x: pointX(ecart), y: ecart >= 0 ? 38 : 184, label: "Ecart", value: ecart },
  ];
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const isPositiveGap = ecart >= 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1F2937]">Evolution des ecarts globaux</p>
          <p className="mt-1 text-xs text-[#6B7280]">Lecture synthetique entre prevu, realise et ecart.</p>
        </div>
        <p className={`text-sm font-bold ${isPositiveGap ? "text-[#1F8A5B]" : "text-[#B91C1C]"}`}>{formatAmount(ecart)}</p>
      </div>
      <svg className="mt-5 h-64 w-full" role="img" viewBox="0 0 320 230">
        <title>Evolution des ecarts globaux</title>
        <line stroke="#E5E7EB" strokeWidth="1" x1="24" x2="296" y1={center} y2={center} />
        <polyline fill="none" points={linePoints} stroke="#0F3D5E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} fill={point.label === "Ecart" ? (isPositiveGap ? "#1F8A5B" : "#B91C1C") : "#2563EB"} r="7" />
            <text fill="#4B5563" fontSize="11" fontWeight="700" textAnchor="middle" x={point.x} y={point.y - 14}>
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="grid gap-2 sm:grid-cols-3">
        {points.map((point) => (
          <div className="rounded-md border border-[#1F2937]/50 bg-white/30 px-3 py-2" key={point.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{point.label}</p>
            <p className="mt-1 text-sm font-bold text-[#1F2937]">{formatAmount(point.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GlobalTotalsChart({ budgetsCount, isLoading, totalPrevu, totalRealise }: { budgetsCount: number; isLoading: boolean; totalPrevu: number; totalRealise: number }) {
  const maxValue = Math.max(totalPrevu, totalRealise, 1);
  const progress = Math.min((totalRealise / maxValue) * 100, 100);
  const dataStatus = isLoading ? "Chargement" : budgetsCount > 0 ? "Disponible" : "Vide";

  return (
    <div className="card">
      <div>
        <p className="text-sm font-semibold text-[#1F2937]">Vue globale des donnees</p>
        <p className="mt-1 text-xs text-[#6B7280]">Previsionnel global, realise global et disponibilite des donnees.</p>
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
                <p className="text-sm font-bold text-[#1F2937]">{formatAmount(item.value)}</p>
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
  const totalPrevu = budgets.reduce((sum, budget) => sum + Number(budget.montant_total_prevu ?? 0), 0);
  const totalRealise = budgets.reduce((sum, budget) => sum + Number(budget.montant_total_realise ?? 0), 0);
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
                {activeExerciceQuery.data.date_debut} au {activeExerciceQuery.data.date_fin}
              </p>
            ) : null}
          </div>
          {activeExerciceQuery.data ? <StatusBadge status={activeExerciceQuery.data.statut} /> : null}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <BudgetStatusChart items={statusChartItems} />
        <GlobalGapChart totalPrevu={totalPrevu} totalRealise={totalRealise} />
      </div>
      <GlobalTotalsChart budgetsCount={budgets.length} isLoading={budgetsQuery.isLoading} totalPrevu={totalPrevu} totalRealise={totalRealise} />
    </div>
  );
}
