import { useEffect, useState } from "react";

interface ValidateProjectModalProps {
  isOpen: boolean;
  projectTitle: string;
  isSubmitting: boolean;
  onConfirm: (comment?: string) => void;
  onCancel: () => void;
}

export function ValidateProjectModal({
  isOpen,
  projectTitle,
  isSubmitting,
  onConfirm,
  onCancel,
}: ValidateProjectModalProps) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (isOpen) {
      setComment("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-950">Valider le projet</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600">
            Êtes-vous sûr de vouloir valider le projet <strong>{projectTitle}</strong> ?
          </p>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700">Commentaire (optionnel)</label>
            <textarea
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={3}
              placeholder="Ajouter un commentaire..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
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
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={() => onConfirm(comment)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Validation en cours..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
