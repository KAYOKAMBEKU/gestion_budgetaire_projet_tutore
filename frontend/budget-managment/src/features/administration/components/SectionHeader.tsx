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
        <h2 className="text-xl font-bold text-[#1F2937]">{title}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
      </div>
      <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold shadow-sm" onClick={onAdd}>
        {buttonLabel}
      </button>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-left text-sm font-medium text-[#DC2626]">{message}</div>;
}

export function LoadingState() {
  return <div className="rounded-lg bg-white/30 px-4 py-8 text-center text-sm font-medium text-[#6B7280]">Chargement...</div>;
}
