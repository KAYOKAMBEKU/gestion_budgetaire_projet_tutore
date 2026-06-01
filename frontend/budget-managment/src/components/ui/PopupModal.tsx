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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/70 p-4 shadow-[inset_0_0_120px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white text-left shadow-2xl ring-1 ring-white/20 ${maxWidth}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-[#1F2937]">{title}</h2>
          <button className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#6B7280] hover:bg-[#F4F7FA] hover:text-[#1F2937]" onClick={onClose} type="button">
            Fermer
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
