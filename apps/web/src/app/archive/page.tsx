"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Mode } from "@culturdle/core";
import { api } from "@/lib/client/api";
import { cx, MODE_META } from "@/lib/client/ui";
import { Header } from "@/components/Header";

interface Day { date: string; puzzleNumber: number; slots: { edition: string; mode: Mode; finished: boolean; solved: boolean | null; points: number | null }[] }

export default function Archive() {
  const [data, setData] = useState<{ isPlus: boolean; days: Day[] } | null>(null);
  useEffect(() => { api("/api/archive").then(setData); }, []);
  return (
    <>
      <Header />
      <h1 className="font-display text-5xl leading-none">Archive</h1>
      <p className="mb-4 mt-1 text-sm text-muted">Past puzzles. Archive plays never count for leagues or streaks.</p>
      {data && !data.isPlus && (
        <div className="mb-4 rounded-2xl border border-icon/40 bg-icon/10 p-4 text-sm">
          The archive is part of <Link href="/profile#plus" className="font-semibold text-icon">Culturdle+</Link>. You can see your past results here.
        </div>
      )}
      {data?.days.length === 0 && <p className="mt-8 text-center text-muted">Nothing here yet — the archive fills up from tomorrow.</p>}
      <ul className="flex flex-col gap-2.5">
        {data?.days.map((d) => (
          <li key={d.date} className="stub px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-display text-2xl">#{d.puzzleNumber}</span>
              <span className="text-sm text-muted">{new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</span>
            </div>
            {(["Global", "India"] as const).map((ed) => (
              <div key={ed} className="mb-1 flex items-center gap-2">
                <span className="w-14 text-xs text-muted">{ed}</span>
                {d.slots.filter((s) => s.edition === ed).map((s) => {
                  const href = `/play/${ed.toLowerCase()}/${s.mode}?date=${d.date}`;
                  const cls = cx("tap flex flex-1 items-center justify-center gap-1 rounded-xl border text-sm", s.finished ? (s.solved ? "border-win/50 bg-win/10" : "border-line bg-surface-2 text-muted") : "border-line");
                  const label = <>{MODE_META[s.mode].emoji} {s.finished ? (s.solved ? `+${s.points}` : "✕") : "Play"}</>;
                  return data.isPlus || s.finished ? <Link key={s.mode} href={href} className={cls}>{label}</Link> : <span key={s.mode} className={cx(cls, "opacity-50")}>{MODE_META[s.mode].emoji} 🔒</span>;
                })}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
