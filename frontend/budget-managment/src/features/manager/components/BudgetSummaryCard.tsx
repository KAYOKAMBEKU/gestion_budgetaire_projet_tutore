import type { DraftBudgetLine } from "../../../types/ligneBudgetaire";
import { formatAmount } from "../utils/formatAmount";

export function BudgetSummaryCard({ lines }: { lines: DraftBudgetLine[] }) {
  const totalRecettes = lines.filter((line) => line.type_ligne === "recette").reduce((sum, line) => sum + line.montant_prevu, 0);
  const totalDepenses = lines.filter((line) => line.type_ligne === "depense").reduce((sum, line) => sum + line.montant_prevu, 0);
  const solde = totalRecettes - totalDepenses;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Resume du budget</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lignes</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{lines.length}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Recettes prevues</p>
          <p className="mt-2 text-lg font-bold text-emerald-800">{formatAmount(totalRecettes)}</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Depenses prevues</p>
          <p className="mt-2 text-lg font-bold text-rose-800">{formatAmount(totalDepenses)}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Solde previsionnel</p>
          <p className="mt-2 text-lg font-bold text-blue-900">{formatAmount(solde)}</p>
        </div>
      </div>
    </section>
  );
}
