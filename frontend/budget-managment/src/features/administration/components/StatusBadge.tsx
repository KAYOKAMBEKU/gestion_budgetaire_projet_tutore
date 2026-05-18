type Status = "actif" | "inactif" | "ouvert" | "cloture" | "valide" | "rejete" | string;

const styles: Record<string, string> = {
  actif: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ouvert: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  valide: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  soumis: "bg-amber-50 text-amber-700 ring-amber-200",
  "En attente de validation": "bg-amber-50 text-amber-700 ring-amber-200",
  inactif: "bg-slate-100 text-slate-600 ring-slate-200",
  cloture: "bg-amber-50 text-amber-700 ring-amber-200",
  rejete: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] ?? styles.inactif}`}>
      {status}
    </span>
  );
}
