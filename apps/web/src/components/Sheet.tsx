"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Bottom sheet on phones, centred 480 px modal on desktop (Foodle §4). */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-[var(--scrim)] md:items-center" onClick={onClose} role="presentation">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`sheet-up max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] bg-bg px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-3 shadow-[var(--shadow-2)] outline-none md:rounded-[20px] md:pt-6 ${wide ? "md:max-w-[560px]" : "md:max-w-[480px]"}`}
      >
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-border md:hidden" aria-hidden />
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="t-title">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
