interface SubmitBudgetConfirmModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SubmitBudgetConfirmModal({ open, loading, onCancel, onConfirm }: SubmitBudgetConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F3D5E]/45 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl">
        <h2 className="text-lg font-bold text-[#1F2937]">Soumettre le budget</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Voulez-vous vraiment soumettre ce budget pour validation ? Apres soumission, il sera envoye a l'administrateur.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary rounded-md px-4 py-2 text-sm font-medium" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={loading} onClick={onConfirm}>
            {loading ? "Soumission..." : "Soumettre"}
          </button>
        </div>
      </div>
    </div>
  );
}
