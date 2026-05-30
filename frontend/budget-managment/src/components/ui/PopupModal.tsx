import type { ReactNode } from "react";

interface PopupModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  onClose: () => void;
}

export function PopupModal({ open, title, children, maxWidth = "max-w-3xl", onClose }: PopupModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F3D5E]/45 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-5 text-left shadow-xl ${maxWidth}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#1F2937]">{title}</h2>
          <button className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#6B7280] hover:bg-[#F4F7FA]" onClick={onClose} type="button">
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
