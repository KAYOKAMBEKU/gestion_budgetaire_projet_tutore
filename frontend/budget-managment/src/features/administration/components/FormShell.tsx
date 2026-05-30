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
    <div className="rounded-lg bg-white/30 p-5 text-left shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-[#1F2937]">{title}</h3>
        <button className="rounded-md px-3 py-1.5 text-sm font-medium text-[#6B7280] hover:bg-[#F4F7FA]" type="button" onClick={onCancel}>
          Fermer
        </button>
      </div>
      <div className="grid gap-4">{children}</div>
      <div className="mt-5 flex justify-end gap-3">
        <button className="btn-secondary rounded-md px-4 py-2 text-sm font-medium" type="button" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={loading} type="submit">
          {loading ? "Enregistrement..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

export const inputClass =
  "mt-1 w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1F2937] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]";

export const labelClass = "text-sm font-medium text-[#374151]";
