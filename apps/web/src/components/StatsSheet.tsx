"use client";

import { useEffect, useState } from "react";
import type { Edition, Mode } from "@culturdle/core";
import { api } from "@/lib/client/api";
import type { Me, StatsView } from "@/lib/client/types";
import { cx, MODE_LABEL } from "@/lib/client/copy";
import { Sheet } from "./Sheet";
import { Segmented } from "./Segmented";
import { ShareButton } from "./Share";
import { useShell } from "./Shell";
import { useToast } from "./Toast";

export function StatsSheet({ edition: e0, mode: m0, onClose }: { edition: Edition; mode: Mode; onClose: () => void }) {
  const { day } = useShell();
  const [edition, setEdition] = useState(e0);
  const [mode, setMode] = useState(m0);
  const [stats, setStats] = useState<StatsView | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const toast = useToast();
  useEffect(() => {
    api<StatsView>("/api/stats").then(setStats).catch(() => {});
    api<Me>("/api/me").then(setMe).catch(() => {});
  }, []);
  const pool = stats?.perPool.find((p) => p.edition === edition && p.mode === mode);
  const ed = day?.editions.find((x) => x.edition === edition);
  const today = ed?.tiles.find((t) => t.mode === mode);
  const todayBar = today?.status === "solved" ? today.guessesUsed - 1 : -1;
  const bars = pool ? [...pool.distribution, pool.failed] : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...bars);

  return (
    <Sheet open onClose={onClose} title="Statistics">
      {toast.node}
      <Segmented label="Mode" value={mode} onChange={setMode} options={(["movie", "music", "icon"] as Mode[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
      <div className="mt-2 flex justify-center">
        <Segmented label="Edition" className="w-56" value={edition} onChange={setEdition} options={(["Global", "India"] as Edition[]).map((x) => ({ value: x, label: x }))} />
      </div>
      <dl className="mt-6 grid grid-cols-4 text-center">
        {[
          [pool?.played ?? 0, "Played"],
          [pool?.solveRate ?? 0, "Win %"],
          [pool?.winStreak ?? 0, "Current streak"],
          [pool?.bestWinStreak ?? 0, "Max streak"],
        ].map(([v, l]) => (
          <div key={l as string}>
            <dd className="t-stat">{v}</dd>
            <dt className="t-meta mx-auto max-w-[70px] text-muted">{l}</dt>
          </div>
        ))}
      </dl>
      <p className="t-label mb-3 mt-7 text-muted">Guess distribution</p>
      <ol className="flex flex-col gap-2" aria-label="Guess distribution">
        {bars.map((n, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="w-3 text-[15px] font-bold">{i === 6 ? "X" : i + 1}</span>
            <span
              className={cx("flex h-[22px] min-w-[26px] items-center justify-end rounded-[2px] px-2 text-[13px] font-bold", i === todayBar ? "bg-correct text-on-correct" : "bg-absent text-on-absent")}
              style={{ width: `${(n / max) * 100}%` }}
            >
              {n}
            </span>
          </li>
        ))}
      </ol>
      <p className="t-meta mt-6 text-center text-muted">
        Play streak {me?.streak.current ?? 0} · best {me?.streak.best ?? 0} · {me?.streak.freezes ?? 0} freeze{me?.streak.freezes === 1 ? "" : "s"} banked · {stats?.totals.points ?? 0} points
      </p>
      {ed && ed.summary.finished > 0 && (
        <div className="mt-5">
          <ShareButton text={ed.summary.share} onToast={toast.show} label="Share" />
        </div>
      )}
    </Sheet>
  );
}
