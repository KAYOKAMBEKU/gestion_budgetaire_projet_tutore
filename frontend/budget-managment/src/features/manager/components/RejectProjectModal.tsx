import { useEffect, useState } from "react";

interface RejectProjectModalProps {
  isOpen: boolean;
  projectTitle: string;
  isSubmitting: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectProjectModal({
  isOpen,
  projectTitle,
  isSubmitting,
  onConfirm,
  onCancel,
}: RejectProjectModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Le motif du rejet est obligatoire");
      return;
    }
    onConfirm(reason);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-950">Rejeter le projet</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600">
            Êtes-vous sûr de vouloir rejeter le projet <strong>{projectTitle}</strong> ?
          </p>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700">
              Motif du rejet <span className="text-red-600">*</span>
            </label>
            <textarea
              className={`mt-2 w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-300 focus:border-red-500 focus:ring-red-500"
              }`}
              rows={3}
              placeholder="Expliciter le motif du rejet..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              disabled={isSubmitting}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Rejet en cours..." : "Rejeter"}
          </button>
        </div>
      </div>
    </div>
  );
}
