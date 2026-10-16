"use client";

import { useCallback, useRef, useState } from "react";

/** Ink toast at the top of the board, 2 s (Foodle §4). */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2000);
  }, []);
  const node = msg ? (
    <div role="status" aria-live="assertive" className="fade pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4">
      <span className="rounded-lg bg-[#1a1a1b] px-4 py-2.5 text-[15px] font-semibold text-white shadow-[var(--shadow-1)] dark:bg-white dark:text-[#1a1a1b]">{msg}</span>
    </div>
  ) : null;
  return { show, node };
}
