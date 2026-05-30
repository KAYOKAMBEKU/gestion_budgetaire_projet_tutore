import type { ProjetStatus } from "../../../types/projet";

interface ProjectStatusBadgeProps {
  status: ProjetStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const statusConfig: Record<ProjetStatus, { label: string; bgColor: string; textColor: string }> = {
    brouillon: { label: "Brouillon", bgColor: "bg-[#F3F4F6]", textColor: "text-[#6B7280]" },
    soumis: { label: "Soumis", bgColor: "bg-[#DBEAFE]", textColor: "text-[#2563EB]" },
    approuve: { label: "Approuvé", bgColor: "bg-[#DCFCE7]", textColor: "text-[#16A34A]" },
    rejete: { label: "Rejeté", bgColor: "bg-[#FEE2E2]", textColor: "text-[#DC2626]" },
    en_execution: { label: "En exécution", bgColor: "bg-[#DBEAFE]", textColor: "text-[#0F3D5E]" },
    cloture: { label: "Clôturé", bgColor: "bg-[#F3F4F6]", textColor: "text-[#374151]" },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}
