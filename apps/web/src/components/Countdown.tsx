"use client";

import { useEffect, useState } from "react";
import { COPY, formatCountdown } from "@/lib/client/copy";

export function Countdown({ seconds, onZero, prefix = COPY.countdown }: { seconds: number; onZero?: () => void; prefix?: string | null }) {
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
    <span className="tabular-nums" suppressHydrationWarning>
      {prefix ? `${prefix} ` : ""}
      {formatCountdown(left)}
    </span>
  );
}
