import type { ProjetStatus } from "../../../types/projet";

interface ProjectStatusBadgeProps {
  status: ProjetStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const statusConfig: Record<ProjetStatus, { label: string; bgColor: string; textColor: string }> = {
    brouillon: { label: "Brouillon", bgColor: "bg-slate-100", textColor: "text-slate-700" },
    soumis: { label: "Soumis", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    approuve: { label: "Approuvé", bgColor: "bg-green-100", textColor: "text-green-700" },
    rejete: { label: "Rejeté", bgColor: "bg-red-100", textColor: "text-red-700" },
    en_execution: { label: "En exécution", bgColor: "bg-amber-100", textColor: "text-amber-700" },
    cloture: { label: "Clôturé", bgColor: "bg-slate-100", textColor: "text-slate-700" },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}
