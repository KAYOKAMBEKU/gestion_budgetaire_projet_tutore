import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const baseClass = "grid h-9 w-9 place-items-center rounded-md border bg-white text-base font-semibold shadow-sm transition hover:bg-[#F4F7FA] disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] disabled:shadow-none";

interface ActionIconButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

interface ActionIconLinkProps {
  children: ReactNode;
  className?: string;
  label: string;
  to: string;
}

export function ActionIconButton({ children, className = "", disabled = false, label, onClick }: ActionIconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`${baseClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

export function ActionIconLink({ children, className = "", label, to }: ActionIconLinkProps) {
  return (
    <Link aria-label={label} className={`${baseClass} ${className}`} title={label} to={to}>
      {children}
    </Link>
  );
}

export function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
