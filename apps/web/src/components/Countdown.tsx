"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/client/ui";

export function Countdown({ seconds, onZero }: { seconds: number; onZero?: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const start = Date.now();
    setLeft(seconds);
    const id = setInterval(() => {
      const l = Math.max(0, seconds - Math.floor((Date.now() - start) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        onZero?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, onZero]);
  return (
    <span className="font-display tabular-nums" aria-label={`Next puzzles in ${formatCountdown(left)}`} suppressHydrationWarning>
      {formatCountdown(left)}
    </span>
  );
}
