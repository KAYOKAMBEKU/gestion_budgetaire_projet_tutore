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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-5 text-left shadow-xl ${maxWidth}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <button className="rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
