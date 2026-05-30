import type { DraftBudgetLine } from "../../../types/ligneBudgetaire";
import { formatAmount } from "../utils/formatAmount";

interface BudgetLinesTableProps {
  lines: DraftBudgetLine[];
  onRemove: (index: number) => void;
}

export function BudgetLinesTable({ lines, onRemove }: BudgetLinesTableProps) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-[#1F2937]">Lignes budgetaires ajoutees</h2>
      <div className="mt-4 overflow-hidden border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB] text-sm">
            <thead className="bg-[#F9FAFB] text-left text-xs uppercase tracking-wide text-[#374151]">
              <tr>
                <th className="px-4 py-3">Libelle</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Montant prevu</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {lines.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={6}>
                    Aucune ligne ajoutee.
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr key={`${line.libelle}-${index}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1F2937]">{line.libelle}</p>
                      <p className="text-xs text-[#6B7280]">{line.description || "Sans description"}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-[#6B7280]">{line.type_ligne}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{line.categorie_nom}</td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      <p>{line.quantite && line.cout_unitaire ? `${line.quantite} x ${formatAmount(line.cout_unitaire)}` : "-"}</p>
                      <p>{line.periode || ""}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(line.montant_prevu)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-sm font-semibold text-[#DC2626] hover:text-[#B91C1C]" onClick={() => onRemove(index)} type="button">
                        Supprimer
                      </button>
                    </td>
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
