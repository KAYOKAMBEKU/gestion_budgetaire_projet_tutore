interface SectionHeaderProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onAdd: () => void;
}

export function SectionHeader({ title, subtitle, buttonLabel, onAdd }: SectionHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="text-left">
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800" onClick={onAdd}>
        {buttonLabel}
      </button>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700">{message}</div>;
}

export function LoadingState() {
  return <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">Chargement...</div>;
}
