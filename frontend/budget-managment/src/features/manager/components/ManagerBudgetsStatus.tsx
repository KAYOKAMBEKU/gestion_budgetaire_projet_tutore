import type { Budget, BudgetStatus } from "../../../types/budget";

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
  brouillon: "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]",
  soumis: "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  soumis_gestionnaire: "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  valide: "bg-[#DCFCE7] text-[#16A34A] ring-[#BBF7D0]",
  valide_gestionnaire: "bg-[#DCFCE7] text-[#16A34A] ring-[#BBF7D0]",
  soumis_admin: "bg-[#EDE9FE] text-[#7C3AED] ring-[#DDD6FE]",
  approuve_admin: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  rejete: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  rejete_gestionnaire: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  rejete_admin: "bg-[#FEE2E2] text-[#B91C1C] ring-[#FECACA]",
  en_execution: "bg-[#DBEAFE] text-[#0F3D5E] ring-[#BFDBFE]",
  execute: "bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]",
  cloture: "bg-[#F3F4F6] text-[#374151] ring-[#E5E7EB]",
};

function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[status]}`}>{labels[status]}</span>;
}

export function ManagerBudgetsStatus({ budgets, loading }: { budgets: Budget[]; loading?: boolean }) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-[#1F2937]">Budgets du departement</h2>
      <p className="mt-1 text-sm text-[#6B7280]">Visualisation de l'etat des budgets crees et soumis.</p>
      <div className="mt-4 overflow-hidden border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB] text-sm">
            <thead className="bg-[#F9FAFB] text-left text-xs uppercase tracking-wide text-[#374151]">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Libelle</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#6B7280]" colSpan={3}>Chargement...</td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#6B7280]" colSpan={3}>Aucun budget trouve.</td>
                </tr>
              ) : (
                budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td className="px-4 py-3 font-semibold text-[#1F2937]">{budget.reference}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{budget.libelle}</td>
                    <td className="px-4 py-3"><BudgetStatusBadge status={budget.statut} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
