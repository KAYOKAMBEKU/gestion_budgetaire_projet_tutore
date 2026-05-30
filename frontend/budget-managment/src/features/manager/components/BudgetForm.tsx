import type { BudgetCreate } from "../../../types/budget";

interface BudgetFormProps {
  value: Pick<BudgetCreate, "reference" | "libelle" | "description">;
  onChange: (value: Pick<BudgetCreate, "reference" | "libelle" | "description">) => void;
}

export function BudgetForm({ value, onChange }: BudgetFormProps) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-bold text-[#1F2937]">Informations du budget</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-[#374151]">
          Reference *
          <input className="input-field" required value={value.reference} onChange={(event) => onChange({ ...value, reference: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-[#374151]">
          Libelle *
          <input className="input-field" required value={value.libelle} onChange={(event) => onChange({ ...value, libelle: event.target.value })} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-[#374151]">
        Description
        <textarea className="input-field" rows={3} value={value.description ?? ""} onChange={(event) => onChange({ ...value, description: event.target.value })} />
      </label>
    </section>
  );
}
