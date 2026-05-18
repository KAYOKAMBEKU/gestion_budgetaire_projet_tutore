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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl">
        <h2 className="text-lg font-bold text-slate-950">Soumettre le budget</h2>
        <p className="mt-2 text-sm text-slate-600">
          Voulez-vous vraiment soumettre ce budget pour validation ? Apres soumission, il sera envoye a l'administrateur.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onCancel}>
            Annuler
          </button>
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={loading} onClick={onConfirm}>
            {loading ? "Soumission..." : "Soumettre"}
          </button>
        </div>
      </div>
    </div>
  );
}
