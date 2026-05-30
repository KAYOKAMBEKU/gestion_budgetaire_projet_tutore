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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F3D5E]/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-lg font-bold text-[#1F2937]">Rejeter le projet</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-[#6B7280]">
            Êtes-vous sûr de vouloir rejeter le projet <strong className="text-[#1F2937]">{projectTitle}</strong> ?
          </p>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-[#374151]">
              Motif du rejet <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              className={`input-field mt-2 ${error ? "border-[#DC2626]" : ""}`}
              rows={3}
              placeholder="Expliciter le motif du rejet..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              disabled={isSubmitting}
            />
            {error && <p className="mt-2 text-sm text-[#DC2626]">{error}</p>}
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
            className="btn-danger rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
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
