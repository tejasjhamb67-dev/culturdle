"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/client/ui";

function HintText({ text }: { text: string }) {
  const i = text.indexOf(":");
  const label = i > 0 && i < 32 ? text.slice(0, i) : null;
  const rest = label ? text.slice(i + 1).trim() : text;
  const parts = rest.split(/(_{3,})/);
  return (
    <p className="leading-snug">
      {label && <span className="mr-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>}
      <span className="block text-[17px]">
        {parts.map((p, k) =>
          /^_{3,}$/.test(p) ? (
            <span key={k} aria-label="hidden word" className="mx-0.5 inline-block h-[0.9em] w-10 translate-y-[2px] rounded-sm bg-miss align-baseline" />
          ) : (
            <span key={k}>{p}</span>
          ),
        )}
      </span>
    </p>
  );
}

export function HintStack({ hints, total = 6, color }: { hints: string[]; total?: number; color: string }) {
  const prev = useRef(hints.length);
  const newest = hints.length > prev.current ? hints.length - 1 : -1;
  useEffect(() => {
    prev.current = hints.length;
  }, [hints.length]);
  return (
    <ol className="flex flex-col gap-2.5" aria-label="Hints">
      {Array.from({ length: total }).map((_, i) => {
        const h = hints[i];
        if (!h) {
          return (
            <li key={i} className="stub flex items-center gap-3 px-4 py-3 opacity-50" aria-label={`Hint ${i + 1}: locked`}>
              <span className="font-display w-6 text-xl text-muted">{i + 1}</span>
              <span className="perf h-6" />
              <span className="text-sm text-muted">{i === total - 1 ? "Final hint + four options" : "Unlocks after a miss"}</span>
              <span className="ml-auto text-muted" aria-hidden>🔒</span>
            </li>
          );
        }
        return (
          <li
            key={i}
            className={cx("stub flex items-stretch gap-3 px-4 py-3.5", i === newest && "hint-new")}
            aria-label={`Hint ${i + 1}: ${h.replace(/_{3,}/g, "blank")}`}
            style={{ boxShadow: i === hints.length - 1 ? `inset 3px 0 0 ${color}` : undefined }}
          >
            <span className="font-display w-6 pt-0.5 text-2xl leading-none" style={{ color }}>{i + 1}</span>
            <span className="perf" />
            <HintText text={h} />
          </li>
        );
      })}
    </ol>
  );
}
