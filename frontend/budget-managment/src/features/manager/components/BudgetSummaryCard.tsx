import type { DraftBudgetLine } from "../../../types/ligneBudgetaire";
import { formatAmount } from "../utils/formatAmount";

export function BudgetSummaryCard({ lines }: { lines: DraftBudgetLine[] }) {
  const totalRecettes = lines.filter((line) => line.type_ligne === "recette").reduce((sum, line) => sum + line.montant_prevu, 0);
  const totalDepenses = lines.filter((line) => line.type_ligne === "depense").reduce((sum, line) => sum + line.montant_prevu, 0);
  const solde = totalRecettes - totalDepenses;

  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-[#1F2937]">Resume du budget</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-[#F9FAFB] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Lignes</p>
          <p className="mt-2 text-2xl font-bold text-[#1F2937]">{lines.length}</p>
        </div>
        <div className="rounded-lg bg-[#DCFCE7] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#16A34A]">Recettes prevues</p>
          <p className="mt-2 text-lg font-bold text-[#15803D]">{formatAmount(totalRecettes)}</p>
        </div>
        <div className="rounded-lg bg-[#FEE2E2] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#DC2626]">Depenses prevues</p>
          <p className="mt-2 text-lg font-bold text-[#B91C1C]">{formatAmount(totalDepenses)}</p>
        </div>
        <div className="rounded-lg bg-[#DBEAFE] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Solde previsionnel</p>
          <p className="mt-2 text-lg font-bold text-[#1D4ED8]">{formatAmount(solde)}</p>
        </div>
      </div>
    </section>
  );
}
