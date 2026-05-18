import type { BudgetCreate } from "../../../types/budget";

interface BudgetFormProps {
  value: Pick<BudgetCreate, "reference" | "libelle" | "description">;
  onChange: (value: Pick<BudgetCreate, "reference" | "libelle" | "description">) => void;
}

const inputClass =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500";

export function BudgetForm({ value, onChange }: BudgetFormProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Informations du budget</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Reference *
          <input className={inputClass} required value={value.reference} onChange={(event) => onChange({ ...value, reference: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Libelle *
          <input className={inputClass} required value={value.libelle} onChange={(event) => onChange({ ...value, libelle: event.target.value })} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Description
        <textarea className={inputClass} rows={3} value={value.description ?? ""} onChange={(event) => onChange({ ...value, description: event.target.value })} />
      </label>
    </section>
  );
}
