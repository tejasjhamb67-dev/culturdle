"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Edition, Mode } from "@culturdle/core";
import { api } from "@/lib/client/api";
import { cx, MODE_LABEL, playHref } from "@/lib/client/copy";
import { Page } from "@/components/Page";
import { Segmented } from "@/components/Segmented";

interface Day { date: string; puzzleNumber: number; slots: { edition: Edition; mode: Mode; finished: boolean; solved: boolean | null; points: number | null }[] }

export default function Archive() {
  const [data, setData] = useState<{ isPlus: boolean; days: Day[] } | null>(null);
  const [edition, setEdition] = useState<Edition>("Global");
  useEffect(() => { api("/api/archive").then(setData); }, []);
  return (
    <Page title="Archive" subtitle="Past puzzles. Replays never change your stats, streaks or leaderboards.">
      <Segmented label="Edition" value={edition} onChange={setEdition} options={[{ value: "Global", label: "Global" }, { value: "India", label: "India" }]} />
      {data && !data.isPlus && (
        <p className="mt-4 rounded-[10px] bg-surface p-4 text-[15px]">Replaying past puzzles is part of <Link href="/settings#plus" className="font-semibold underline underline-offset-4">Culturdle+</Link>. Your past results are below.</p>
      )}
      {data?.days.length === 0 && <p className="mt-10 text-center text-muted">The archive starts filling up tomorrow.</p>}
      <ol className="mt-4 flex flex-col">
        {data?.days.map((d) => (
          <li key={d.date} className="flex items-center gap-3 border-b border-border py-3">
            <span className="w-24 shrink-0">
              <span className="block text-[15px] font-bold">No. {d.puzzleNumber}</span>
              <span className="t-meta text-muted">{new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</span>
            </span>
            <span className="grid flex-1 grid-cols-3 gap-1.5">
              {d.slots.filter((s) => s.edition === edition).map((s) => {
                const tone = !s.finished ? "border border-border text-text" : s.solved ? "bg-correct text-on-correct" : "bg-absent text-on-absent";
                const label = `${MODE_LABEL[s.mode]}${s.finished ? (s.solved ? " ✓" : " ×") : ""}`;
                const cls = cx("t-tile flex h-11 items-center justify-center rounded-[4px]", tone);
                return data.isPlus || s.finished
                  ? <Link key={s.mode} href={playHref(edition, s.mode, d.date)} className={cls}>{label}</Link>
                  : <span key={s.mode} className={cx(cls, "text-muted opacity-60")}>{MODE_LABEL[s.mode]}</span>;
              })}
            </span>
          </li>
        ))}
      </ol>
    </Page>
  );
}
