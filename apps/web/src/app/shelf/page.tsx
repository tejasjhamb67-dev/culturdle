"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Mode } from "@culturdle/core";
import { api } from "@/lib/client/api";
import { cx, MODE_META } from "@/lib/client/ui";
import { Header } from "@/components/Header";

interface Item { play_date: string; edition: string; mode: Mode; answer: string; year: number | null; decade: string | null; guess_count: number; category: string | null }

export default function Shelf() {
  const [data, setData] = useState<{ total: number; limited: boolean; items: Item[] } | null>(null);
  const [mode, setMode] = useState<Mode | "all">("all");
  const [edition, setEdition] = useState<"all" | "Global" | "India">("all");
  const [decade, setDecade] = useState<string>("all");

  useEffect(() => { api("/api/shelf").then(setData); }, []);

  const filtered = useMemo(
    () => (data?.items ?? []).filter((i) => (mode === "all" || i.mode === mode) && (edition === "all" || i.edition === edition) && (decade === "all" || i.decade === decade)),
    [data, mode, edition, decade],
  );
  const decades = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of data?.items ?? []) if (i.decade && (mode === "all" || i.mode === mode)) m.set(i.decade, (m.get(i.decade) ?? 0) + 1);
    return [...m.entries()].sort();
  }, [data, mode]);

  const chip = (active: boolean) => cx("tap shrink-0 rounded-full border px-3.5 text-sm font-semibold", active ? "border-icon bg-icon/15 text-text" : "border-line text-muted");

  return (
    <>
      <Header />
      <div className="mb-3 flex items-end justify-between">
        <h1 className="font-display text-5xl leading-none">Your Shelf</h1>
        <span className="text-muted"><span className="font-display text-3xl text-text">{data?.total ?? 0}</span> solved</span>
      </div>
      <div className="scrollbar-none -mx-4 mb-2 flex gap-2 overflow-x-auto px-4">
        {(["all", "movie", "music", "icon"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={chip(mode === m)}>{m === "all" ? "All" : `${MODE_META[m].emoji} ${MODE_META[m].label}`}</button>
        ))}
        {(["all", "Global", "India"] as const).map((e) => (
          <button key={e} onClick={() => setEdition(e)} className={chip(edition === e)}>{e === "all" ? "Both editions" : e}</button>
        ))}
      </div>
      {decades.length > 0 && (
        <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" aria-label="Decades">
          <button onClick={() => setDecade("all")} className={chip(decade === "all")}>Every decade</button>
          {decades.map(([d, n]) => (
            <button key={d} onClick={() => setDecade(d)} className={chip(decade === d)}>{d} · {n}</button>
          ))}
        </div>
      )}
      {!data ? (
        <div className="grid animate-pulse grid-cols-2 gap-2.5">{[0, 1, 2, 3].map((i) => <div key={i} className="stub h-28" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="font-display text-3xl">An empty shelf</p>
          <p className="mt-1 text-muted">Every answer you solve lands here, grouped by decade and mode.</p>
          <Link href="/" className="tap mt-5 inline-flex items-center rounded-full bg-icon px-6 font-semibold text-black">Play today’s puzzles</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {filtered.map((i) => (
            <li key={`${i.play_date}${i.edition}${i.mode}`} className="stub overflow-hidden">
              <div className="h-1.5" style={{ background: MODE_META[i.mode].color }} />
              <div className="px-3.5 py-3">
                <p className="text-xs text-muted">{MODE_META[i.mode].emoji} {i.edition} · {i.play_date.slice(5)}</p>
                <p className="font-display mt-1 text-2xl leading-[1.05]">{i.answer}</p>
                <p className="mt-1 text-xs text-muted">{i.year ?? i.category ?? ""} · solved in {i.guess_count}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data?.limited && (
        <p className="mt-4 rounded-2xl border border-dashed border-icon/50 p-4 text-center text-sm">
          Showing your latest 24. <Link href="/profile#plus" className="font-semibold text-icon">Culturdle+</Link> unlocks the full Shelf.
        </p>
      )}
    </>
  );
}
