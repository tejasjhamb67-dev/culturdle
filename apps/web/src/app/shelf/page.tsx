"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Mode } from "@culturdle/core";
import { api } from "@/lib/client/api";
import { cx, MODE_LABEL } from "@/lib/client/copy";
import { Page } from "@/components/Page";
import { Segmented } from "@/components/Segmented";
import { ButtonLink } from "@/components/Button";

interface Item { play_date: string; edition: string; mode: Mode; answer: string; year: number | null; decade: string | null; guess_count: number; category: string | null; answer_type: string }

export default function Shelf() {
  const [data, setData] = useState<{ total: number; limited: boolean; items: Item[] } | null>(null);
  const [mode, setMode] = useState<Mode | "all">("all");
  const [decade, setDecade] = useState("all");
  useEffect(() => { api("/api/shelf").then(setData); }, []);

  const items = useMemo(() => (data?.items ?? []).filter((i) => (mode === "all" || i.mode === mode) && (decade === "all" || i.decade === decade)), [data, mode, decade]);
  const decades = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of data?.items ?? []) if (i.decade && (mode === "all" || i.mode === mode)) m.set(i.decade, (m.get(i.decade) ?? 0) + 1);
    return [...m.entries()].sort();
  }, [data, mode]);

  return (
    <Page title="Your shelf" subtitle={`${data?.total ?? 0} answers solved, grouped by decade`} wide>
      <Segmented label="Mode" value={mode} onChange={(m) => { setMode(m); setDecade("all"); }} options={[{ value: "all", label: "All" }, ...(["movie", "music", "icon"] as Mode[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))]} />
      {decades.length > 0 && (
        <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {[["all", data?.items.length ?? 0] as [string, number], ...decades].map(([d, n]) => (
            <button key={d} onClick={() => setDecade(d)} className={cx("t-chip h-8 shrink-0 rounded-full border px-3.5", decade === d ? "border-border-strong bg-surface text-text" : "border-border text-muted")}>
              {d === "all" ? "Every decade" : d} · {n}
            </button>
          ))}
        </div>
      )}
      {!data ? (
        <div className="mt-5 grid animate-pulse grid-cols-2 gap-2.5 md:grid-cols-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-[10px] bg-surface" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="t-title">An empty shelf</p>
          <p className="mt-1 text-muted">Every answer you solve lands here.</p>
          <div className="mx-auto mt-5 max-w-xs"><ButtonLink full href="/">Play today’s puzzles</ButtonLink></div>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {items.map((i) => (
            <li key={`${i.play_date}${i.edition}${i.mode}`} className="flex flex-col rounded-[10px] border border-border p-3.5">
              <span className="t-label text-muted">{MODE_LABEL[i.mode]} · {i.edition}</span>
              <span className="mt-1 font-serif text-[19px] font-semibold leading-6">{i.answer}</span>
              <span className="t-meta mt-auto pt-2 text-muted">{i.year ?? i.category ?? i.answer_type} · solved in {i.guess_count}</span>
            </li>
          ))}
        </ul>
      )}
      {data?.limited && (
        <p className="mt-5 text-center text-[15px] text-muted">Showing your latest 24. <Link href="/settings#plus" className="font-semibold text-text underline underline-offset-4">Culturdle+</Link> shows your whole shelf.</p>
      )}
    </Page>
  );
}
