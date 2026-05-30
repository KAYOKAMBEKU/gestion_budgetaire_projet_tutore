import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { budgetService } from "../../../services/budgetService";
import { ligneBudgetaireService } from "../../../services/ligneBudgetaireService";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { getBudgetWarnings } from "../utils/budgetAnalysis";
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

export function ManagerDashboardPage() {
  const { authLoading, currentUser, isAuthenticated, isManager } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["manager", "dashboard", currentUser?.departement_id],
    enabled: Boolean(currentUser?.departement_id),
    queryFn: async () => {
      const budgets = await budgetService.getBudgetsByDepartement(currentUser?.departement_id ?? 0);
      const rows = await Promise.all(
        budgets.map(async (budget) => ({
          budget,
          lignes: await ligneBudgetaireService.getLignesByBudget(budget.id),
        })),
      );
      return rows;
    },
  });

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au gestionnaire budgetaire." title="Acces refuse" />;
  }

  const rows = dashboardQuery.data ?? [];
  const budgets = rows.map((row) => row.budget);
  const totalPrevisionnel = budgets.reduce((sum, budget) => sum + Number(budget.montant_total_prevu ?? 0), 0);
  const countByStatus = (statuses: string[]) => budgets.filter((budget) => statuses.includes(budget.statut)).length;
  const warnings = rows.flatMap((row) => getBudgetWarnings(row.budget, row.lignes).map((message) => ({ budget: row.budget, message }))).slice(0, 5);

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1F8A5B]">Espace gestionnaire</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Bienvenue, {currentUser?.prenom ?? currentUser?.nom}</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Synthese des budgets previsionnels de votre departement et alertes avant transmission.</p>
          </section>

          {dashboardQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{String(dashboardQuery.error)}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-[#F59E0B] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0F3D5E]">Budgets soumis</p>
              <p className="mt-3 text-3xl font-bold text-[#0F3D5E]">{countByStatus(["soumis", "soumis_gestionnaire"])}</p>
            </div>
            <div className="rounded-lg border border-[#16A34A] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0F3D5E]">Budgets approuves</p>
              <p className="mt-3 text-3xl font-bold text-[#0F3D5E]">{countByStatus(["approuve_admin", "en_execution", "execute", "cloture"])}</p>
            </div>
            <div className="rounded-lg border border-[#DC2626] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0F3D5E]">Budgets rejetes</p>
              <p className="mt-3 text-3xl font-bold text-[#0F3D5E]">{countByStatus(["rejete", "rejete_gestionnaire"])}</p>
            </div>
            <div className="rounded-lg border border-[#7C3AED] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0F3D5E]">Transmis a l'Admin</p>
              <p className="mt-3 text-3xl font-bold text-[#0F3D5E]">{countByStatus(["soumis_admin"])}</p>
            </div>
            <div className="rounded-lg border border-[#0F3D5E] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0F3D5E]">Previsionnel departement</p>
              <p className="mt-3 text-xl font-bold text-[#0F3D5E]">{formatAmount(totalPrevisionnel)}</p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <h2 className="text-lg font-bold text-[#1F2937]">Alertes de coherence</h2>
            <div className="mt-4 grid gap-3">
              {warnings.length === 0 ? (
                <p className="rounded-lg bg-[#DCFCE7] px-4 py-3 text-sm font-medium text-[#16A34A]">Aucune incoherence de dates ou de lignes incomplete detectee.</p>
              ) : warnings.map((warning, index) => (
                <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-sm text-[#92400E]" key={`${warning.budget.id}-${index}`}>
                  <span className="font-semibold">{warning.budget.projet?.titre ?? warning.budget.reference}</span> : {warning.message}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
