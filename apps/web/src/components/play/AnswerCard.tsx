"use client";

import Link from "next/link";
import { ChartColumn } from "lucide-react";
import type { PuzzleView } from "@/lib/client/types";
import { verdictFor } from "@/lib/client/copy";
import { StatusPill } from "../StatusPill";
import { Button, ButtonLink } from "../Button";
import { ShareButton } from "../Share";
import { Countdown } from "../Countdown";
import { MiniSquares } from "../Tile";
import { rowStates } from "./Board";

/** Replaces the board when the puzzle ends (Foodle §4 AnswerCard, without a photo for now). */
export function AnswerCard({
  view, share, next, secondsToReset, onStats, onReport, onToast, onZero,
}: {
  view: PuzzleView;
  share?: string;
  next?: { href: string; label: string } | null;
  secondsToReset?: number;
  onStats: () => void;
  onReport: () => void;
  onToast: (m: string) => void;
  onZero?: () => void;
}) {
  const r = view.reveal!;
  const fromOptions = view.solved && view.pips.at(-1) === "options";
  const verdict = verdictFor(view.solved, view.guessesUsed);
  const meta = [r.year, view.answerType === "Film" ? null : view.answerType, r.category].filter(Boolean).join(" · ");
  return (
    <section className="rise flex flex-col gap-4" aria-live="polite" aria-label="Answer">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={view.solved ? (fromOptions ? "options" : "solved") : "missed"} guesses={view.guessesUsed} />
        <span className="text-[17px] font-semibold text-muted">{view.solved ? `${verdict}.` : `${verdict}. It was ${r.answer}.`}</span>
      </div>
      <div>
        <h2 className="font-serif text-[34px] font-semibold leading-[40px]">{r.answer}</h2>
        {meta && <p className="mt-1 text-[15px] text-muted">{meta}</p>}
      </div>
      {r.fact && <p className="text-[15px] leading-[22px]">{r.fact}</p>}
      <div className="flex items-center justify-between rounded-[10px] bg-surface px-4 py-3">
        <span className="t-meta text-muted">{view.archive ? "Archive play · no points" : `+${view.points ?? 0} point${view.points === 1 ? "" : "s"}`}</span>
        <MiniSquares states={rowStates(view)} />
      </div>
      <details className="rounded-[10px] border border-border px-4 py-3">
        <summary className="t-label cursor-pointer text-muted">All six hints</summary>
        <ol className="mt-2 flex flex-col gap-1.5 text-[15px]">
          {view.hints.map((h, i) => (
            <li key={i}><span className="t-label mr-2 text-muted">{i + 1}</span>{h}</li>
          ))}
        </ol>
      </details>
      <div className="flex flex-col gap-2.5">
        {share && !view.archive && <ShareButton text={share} onToast={onToast} />}
        <Button variant="secondary" full onClick={onStats}><ChartColumn size={18} aria-hidden /> See stats</Button>
        {next && <ButtonLink variant="ghost" href={next.href}>{next.label} →</ButtonLink>}
      </div>
      {secondsToReset !== undefined && !view.archive && (
        <p className="text-center text-[17px] font-semibold text-muted"><Countdown seconds={secondsToReset} onZero={onZero} /></p>
      )}
      <p className="text-center">
        <button onClick={onReport} className="t-meta h-11 px-3 text-muted underline underline-offset-4">Report a problem</button>
        {view.archive && <Link href="/archive" className="t-meta ml-2 text-muted underline underline-offset-4">Back to archive</Link>}
      </p>
    </section>
  );
}
