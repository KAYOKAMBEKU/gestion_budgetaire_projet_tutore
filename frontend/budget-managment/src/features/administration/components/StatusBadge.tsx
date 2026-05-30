type Status = "actif" | "inactif" | "ouvert" | "cloture" | "valide" | "rejete" | string;

const styles: Record<string, string> = {
  actif: "bg-[#DCFCE7] text-[#16A34A] ring-[#BBF7D0]",
  ouvert: "bg-[#DBEAFE] text-[#2563EB] ring-[#BFDBFE]",
  valide: "bg-[#DCFCE7] text-[#16A34A] ring-[#BBF7D0]",
  soumis: "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  "En attente de validation": "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  inactif: "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]",
  cloture: "bg-[#F3F4F6] text-[#374151] ring-[#E5E7EB]",
  rejete: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] ?? styles.inactif}`}>
      {status}
    </span>
  );
}
