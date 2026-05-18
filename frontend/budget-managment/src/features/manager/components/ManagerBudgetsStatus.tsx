import type { Budget, BudgetStatus } from "../../../types/budget";

const labels: Record<BudgetStatus, string> = {
  brouillon: "Brouillon",
  soumis: "En attente de validation",
  valide: "Valide",
  rejete: "Rejete",
  en_execution: "En execution",
  cloture: "Cloture",
};

const tones: Record<BudgetStatus, string> = {
  brouillon: "bg-slate-100 text-slate-700 ring-slate-200",
  soumis: "bg-amber-50 text-amber-700 ring-amber-200",
  valide: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejete: "bg-rose-50 text-rose-700 ring-rose-200",
  en_execution: "bg-blue-50 text-blue-700 ring-blue-200",
  cloture: "bg-slate-100 text-slate-700 ring-slate-200",
};

function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[status]}`}>{labels[status]}</span>;
}

export function ManagerBudgetsStatus({ budgets, loading }: { budgets: Budget[]; loading?: boolean }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Budgets du departement</h2>
      <p className="mt-1 text-sm text-slate-500">Visualisation de l'etat des budgets crees et soumis.</p>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Libelle</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>Chargement...</td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>Aucun budget trouve.</td>
                </tr>
              ) : (
                budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{budget.reference}</td>
                    <td className="px-4 py-3 text-slate-700">{budget.libelle}</td>
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
