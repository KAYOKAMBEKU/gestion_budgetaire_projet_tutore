import type { DraftBudgetLine } from "../../../types/ligneBudgetaire";
import { formatAmount } from "../utils/formatAmount";

interface BudgetLinesTableProps {
  lines: DraftBudgetLine[];
  onRemove: (index: number) => void;
}

export function BudgetLinesTable({ lines, onRemove }: BudgetLinesTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Lignes budgetaires ajoutees</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Libelle</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3">Montant prevu</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    Aucune ligne ajoutee.
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr key={`${line.libelle}-${index}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{line.libelle}</p>
                      <p className="text-xs text-slate-500">{line.description || "Sans description"}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">{line.type_ligne}</td>
                    <td className="px-4 py-3 text-slate-700">{line.categorie_nom}</td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{formatAmount(line.montant_prevu)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-sm font-semibold text-rose-600 hover:text-rose-800" onClick={() => onRemove(index)} type="button">
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
