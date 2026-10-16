"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Edition, Mode } from "@culturdle/core";
import { api } from "@/lib/client/api";
import type { LeagueRow } from "@/lib/client/types";
import { cx, MODE_LABEL, playHref } from "@/lib/client/copy";
import { useShell, tileStatus } from "../Shell";
import { StatusPill } from "../StatusPill";
import { Segmented } from "../Segmented";
import { Avatar } from "../Avatar";

/** Desktop left rail: today's three modes for this edition + edition switch. */
export function LeftRail({ edition, mode }: { edition: Edition; mode: Mode }) {
  const { day } = useShell();
  const router = useRouter();
  const ed = day?.editions.find((e) => e.edition === edition);
  return (
    <aside className="hidden lg:block" aria-label="Today's puzzles">
      <p className="t-label mb-3 text-muted">Today</p>
      <ul className="flex flex-col gap-3">
        {(["movie", "music", "icon"] as Mode[]).map((m) => {
          const t = ed?.tiles.find((x) => x.mode === m);
          const on = m === mode;
          return (
            <li key={m}>
              <Link href={playHref(edition, m)} aria-current={on ? "page" : undefined} className={cx("flex h-16 items-center justify-between rounded-[10px] border px-4", on ? "border-border-strong bg-surface" : "border-border")}>
                <span>
                  <span className="t-headline block leading-5">{MODE_LABEL[m]}</span>
                  <span className="t-meta text-muted">{t?.prompt ?? `${edition} edition`}</span>
                </span>
                <StatusPill status={tileStatus(t)} guesses={t?.guessesUsed ?? 0} />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="t-label mb-3 mt-8 text-muted">Edition</p>
      <Segmented label="Edition" value={edition} onChange={(e) => router.push(playHref(e, mode))} options={(["Global", "India"] as Edition[]).map((e) => ({ value: e, label: e }))} />
    </aside>
  );
}

/** Desktop right rail: streak card and friends this week. */
export function RightRail() {
  const { day } = useShell();
  const [rows, setRows] = useState<LeagueRow[] | null>(null);
  useEffect(() => {
    api<{ rows: LeagueRow[] }>("/api/leagues/friends").then((r) => setRows(r.rows)).catch(() => setRows([]));
  }, [day]);
  const s = day?.streak;
  return (
    <aside className="hidden lg:block" aria-label="Your streak and friends">
      <div className="rounded-[16px] bg-surface p-6">
        <p className="text-[15px] font-semibold text-muted">Your streak</p>
        <p className="mt-2 font-serif text-[40px] font-semibold leading-[46px]">{s?.current ?? 0} day{s?.current === 1 ? "" : "s"}</p>
        <p className="mt-2 text-[15px] text-muted">Best {s?.best ?? 0} · {s?.freezes ?? 0} freeze{s?.freezes === 1 ? "" : "s"} banked</p>
      </div>
      <p className="t-label mb-3 mt-8 text-muted">Friends this week</p>
      {rows && rows.length <= 1 ? (
        <p className="text-[15px] text-muted">Culturdle is better with friends. <Link href="/leaderboard" className="font-semibold text-text underline underline-offset-4">Share your invite link.</Link></p>
      ) : (
        <ul className="flex flex-col gap-1">
          {(rows ?? []).slice(0, 6).map((r) => (
            <li key={r.playerId} className="flex h-12 items-center gap-3">
              <Avatar name={r.name} me={r.me} />
              <span className="flex-1 truncate text-[17px] font-semibold">{r.me ? "You" : r.name}</span>
              <span className="text-[17px] font-bold tabular-nums">{r.score}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
