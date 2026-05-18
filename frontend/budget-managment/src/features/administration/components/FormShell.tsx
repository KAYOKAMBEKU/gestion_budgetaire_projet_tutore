import type { ReactNode } from "react";

interface FormShellProps {
  title: string;
  children: ReactNode;
  submitLabel: string;
  loading?: boolean;
  onCancel: () => void;
}

export function FormShell({ title, children, submitLabel, loading, onCancel }: FormShellProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <button className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100" type="button" onClick={onCancel}>
          Fermer
        </button>
      </div>
      <div className="grid gap-4">{children}</div>
      <div className="mt-5 flex justify-end gap-3">
        <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button" onClick={onCancel}>
          Annuler
        </button>
        <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60" disabled={loading} type="submit">
          {loading ? "Enregistrement..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

export const inputClass =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400";

export const labelClass = "text-sm font-medium text-slate-700";
