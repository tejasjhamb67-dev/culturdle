"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Edition } from "@culturdle/core";
import { api, store, trackClient } from "@/lib/client/api";
import type { DayView, Tile } from "@/lib/client/types";
import { cx, EDITION_META, MODE_META } from "@/lib/client/ui";
import { Header } from "@/components/Header";
import { Countdown } from "@/components/Countdown";
import { Pips } from "@/components/Pips";
import { Onboarding } from "@/components/Onboarding";
import { ShareButton } from "@/components/Share";

function TileCard({ edition, tile }: { edition: Edition; tile: Tile }) {
  const m = MODE_META[tile.mode];
  const statusText =
    tile.status === "play" ? "Play" : tile.status === "in_progress" ? `${tile.guessesUsed}/6 used` : tile.status === "solved" ? `+${tile.points} pts` : "Missed";
  return (
    <Link
      href={`/play/${edition.toLowerCase()}/${tile.mode}`}
      className="stub group flex flex-col overflow-hidden transition-transform active:scale-[0.98]"
      aria-label={`${edition} ${m.label}: ${tile.prompt}. ${statusText}`}
    >
      <div className="h-1.5" style={{ background: m.color }} />
      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-3 text-center">
        <span className="text-3xl" aria-hidden>{m.emoji}</span>
        <span className="font-display mt-1 text-2xl leading-none" style={{ color: m.color }}>{m.label}</span>
        <span className="mt-1 min-h-8 text-[12px] leading-tight text-muted">{tile.prompt.replace("Guess the ", "The ")}</span>
        <div className="my-2 w-full border-t-2 border-dashed border-line" />
        {tile.status === "play" ? (
          <span className="rounded-full px-4 py-1 text-sm font-bold text-black" style={{ background: m.color === "var(--icon)" ? m.color : "var(--text)" }}>
            Play
          </span>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Pips pips={tile.pips} size="sm" />
            <span className={cx("text-sm font-semibold", tile.status === "solved" ? "text-win" : tile.status === "missed" ? "text-muted" : "text-text")}>
              {statusText}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Today() {
  const [day, setDay] = useState<DayView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [onboard, setOnboard] = useState(false);

  const load = useCallback(async () => {
    try {
      setDay(await api<DayView>("/api/today"));
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    if (!store.get("cd_onboarded")) setOnboard(true);
    void load();
    trackClient("app_open");
  }, [load]);

  const finishOnboarding = async (edition: Edition) => {
    store.set("cd_onboarded", "1");
    setOnboard(false);
    await api("/api/me", { method: "PATCH", json: { homeEdition: edition } }).catch(() => {});
    void load();
  };

  return (
    <>
      {onboard && <Onboarding onDone={finishOnboarding} />}
      <Header streak={day?.streak.current} />
      {err && <p className="mt-8 rounded-2xl border border-line bg-surface p-4 text-center text-muted">{err}</p>}
      {!day && !err && <TodaySkeleton />}
      {day && (
        <main className="flex flex-col gap-7">
          <section className="flex items-center justify-between rounded-2xl border border-line bg-surface/60 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Puzzle</p>
              <p className="font-display text-3xl leading-none">#{day.editions[0]?.puzzleNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-muted">New puzzles in</p>
              <p className="text-3xl leading-none"><Countdown seconds={day.secondsToReset} onZero={load} /></p>
            </div>
          </section>

          {day.editions.map((ed, idx) => (
            <section key={ed.edition} aria-labelledby={`ed-${ed.edition}`}>
              <div className="mb-3 flex items-end justify-between">
                <h2 id={`ed-${ed.edition}`} className="font-display flex items-center gap-2 text-3xl leading-none">
                  <span aria-hidden className="text-2xl">{EDITION_META[ed.edition].flag}</span>
                  {ed.edition} edition
                  {idx === 0 && <span className="ml-1 rounded-full border border-line px-2 py-0.5 font-sans text-[11px] tracking-normal text-muted">HOME</span>}
                </h2>
                <span className="text-sm text-muted">
                  <span className="font-display text-xl text-text">{ed.summary.score}</span>/18
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {ed.tiles.map((t) => <TileCard key={t.mode} edition={ed.edition} tile={t} />)}
              </div>
              {ed.summary.complete && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                  <div>
                    <p className="font-display text-2xl leading-none">
                      {ed.summary.perfect ? "🏆 Perfect Day" : "Day complete"} · {ed.summary.score} pts
                    </p>
                    <p className="text-sm text-muted">Share your {ed.edition} grid, spoiler-free.</p>
                  </div>
                  <ShareButton text={ed.summary.share} imageUrl={`/api/share/${day.date}/${ed.edition}/image`} className="tap shrink-0 rounded-full bg-win px-5 py-2.5 font-semibold text-white" />
                </div>
              )}
            </section>
          ))}

          <section className="rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-muted">
            <p>
              <span className="font-semibold text-text">How it works.</span> Each puzzle gives you six guesses. Every miss or skip unlocks a new hint; your sixth guess
              shows four options. Solve on guess 1 for 6 points, down to 1 point on guess 6. Play at least one puzzle a day to keep your 🔥 streak.
            </p>
            <Link href="/archive" className="mt-2 inline-block font-semibold text-icon">Browse the archive →</Link>
          </section>
        </main>
      )}
    </>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-7" aria-hidden>
      <div className="h-16 rounded-2xl bg-surface" />
      {[0, 1].map((k) => (
        <div key={k}>
          <div className="mb-3 h-7 w-48 rounded bg-surface" />
          <div className="grid grid-cols-3 gap-2.5">{[0, 1, 2].map((i) => <div key={i} className="stub h-40" />)}</div>
        </div>
      ))}
    </div>
  );
}
