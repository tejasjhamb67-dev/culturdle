"use client";

import { useEffect } from "react";

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="hint-new w-full max-w-md rounded-t-3xl border border-line bg-surface p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl">{title}</h2>
          <button onClick={onClose} className="tap rounded-full text-2xl text-muted" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
