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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F3D5E]/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-lg font-bold text-[#1F2937]">Valider le projet</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-[#6B7280]">
            Êtes-vous sûr de vouloir valider le projet <strong className="text-[#1F2937]">{projectTitle}</strong> ?
          </p>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-[#374151]">Commentaire (optionnel)</label>
            <textarea
              className="input-field mt-2"
              rows={3}
              placeholder="Ajouter un commentaire..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
          <button
            className="btn-secondary rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            className="btn-success rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
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
