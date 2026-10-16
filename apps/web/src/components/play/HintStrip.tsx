"use client";

import { useEffect, useRef } from "react";

function HintText({ text }: { text: string }) {
  const i = text.indexOf(":");
  const label = i > 0 && i < 34 ? text.slice(0, i) : null;
  const rest = label ? text.slice(i + 1).trim() : text;
  return (
    <span className="min-w-0">
      {label && <span className="t-label block text-muted">{label}</span>}
      <span className="block text-[15px] font-semibold leading-[21px]">
        {rest.split(/(_{3,})/).map((p, k) =>
          /^_{3,}$/.test(p) ? (
            <span key={k} role="img" aria-label="hidden word" className="mx-0.5 inline-block h-3 w-9 rounded-[2px] bg-border align-middle" />
          ) : (
            <span key={k}>{p}</span>
          ),
        )}
      </span>
    </span>
  );
}

/** Hints as the clue strip: label + "k of 6", revealed hints as rows, locked hints as dashed numbers. */
export function HintStrip({ hints, total = 6 }: { hints: string[]; total?: number }) {
  const prev = useRef(hints.length);
  const newest = hints.length > prev.current ? hints.length - 1 : -1;
  useEffect(() => {
    prev.current = hints.length;
  }, [hints.length]);
  const locked = Array.from({ length: total - hints.length }, (_, k) => hints.length + k + 1);
  return (
    <section aria-label="Hints">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="t-label text-muted">Hints</h2>
        <span className="t-meta font-semibold text-muted">{hints.length} of {total}</span>
      </div>
      <ol className="flex flex-col gap-2" aria-live="polite">
        {hints.map((h, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-[10px] border border-border bg-surface px-3.5 py-2.5 ${i === newest ? "rise" : ""}`}
            aria-label={`Hint ${i + 1} of ${total}: ${h.replace(/_{3,}/g, "blank")}`}
          >
            <span className="t-label mt-[1px] w-3 shrink-0 text-muted">{i + 1}</span>
            <HintText text={h} />
          </li>
        ))}
      </ol>
      {locked.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2" aria-label={`${locked.length} hints locked`}>
          {locked.map((n) => (
            <span key={n} className="t-meta flex h-8 w-11 items-center justify-center rounded-[4px] border border-dashed border-border-strong font-semibold text-muted">
              {n}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
