"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MODES, PIP_EMOJI, type Edition, type Mode } from "@culturdle/core";
import { api, ApiError } from "@/lib/client/api";
import type { DayView, PuzzleView } from "@/lib/client/types";
import { cx, EDITION_META, MODE_META } from "@/lib/client/ui";
import { HintStack } from "@/components/HintStack";
import { GuessInput } from "@/components/GuessInput";
import { Pips } from "@/components/Pips";
import { Sheet } from "@/components/Sheet";
import { ShareButton } from "@/components/Share";
import { Countdown } from "@/components/Countdown";

const ERRORS: Record<string, string> = {
  not_in_list: "Not in the list — pick a suggestion.",
  ambiguous: "Did you mean one of these?",
  repeat: "You already tried that one.",
  rate_limited: "Slow down a little.",
};

export default function PuzzlePage({ params }: { params: Promise<{ edition: string; mode: string }> }) {
  const { edition: edRaw, mode: modeRaw } = use(params);
  const edition = (edRaw.toLowerCase() === "india" ? "India" : "Global") as Edition;
  const mode = (MODES.includes(modeRaw as Mode) ? modeRaw : "movie") as Mode;
  const date = useSearchParams().get("date");
  const [view, setView] = useState<PuzzleView | null>(null);
  const [day, setDay] = useState<DayView | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const meta = MODE_META[mode];
  const qs = date ? `?date=${date}` : "";

  const loadDay = useCallback(() => {
    if (!date) api<DayView>("/api/today").then(setDay).catch(() => {});
  }, [date]);

  useEffect(() => {
    setView(null);
    setError(null);
    api<PuzzleView>(`/api/play/${edition}/${mode}${qs}`)
      .then((v) => {
        setView(v);
        if (v.finished) loadDay();
      })
      .catch((e: ApiError) => setError({ code: e.code, message: e.message }));
  }, [edition, mode, qs, loadDay]);

  const send = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await api<{ puzzle: PuzzleView }>(`/api/play/${edition}/${mode}/guess`, { method: "POST", json: { ...payload, ...(date ? { date } : {}) } });
      setView(r.puzzle);
      if (r.puzzle.finished) {
        loadDay();
        setTimeout(() => document.getElementById("reveal")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      } else {
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 60);
      }
      return undefined;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "finished") window.location.reload();
        return { error: ERRORS[e.code] ?? e.message, candidates: e.data?.candidates };
      }
      return { error: "Network error — try again." };
    } finally {
      setBusy(false);
    }
  };

  const next = useMemo(() => {
    if (!day) return null;
    const order = [...day.editions].sort((a, b) => (a.edition === edition ? -1 : b.edition === edition ? 1 : 0));
    for (const ed of order) for (const t of ed.tiles) if (t.status === "play" || t.status === "in_progress") return { edition: ed.edition, mode: t.mode };
    return null;
  }, [day, edition]);
  const edSummary = day?.editions.find((e) => e.edition === edition)?.summary;

  if (error) {
    return (
      <main className="mt-16 text-center">
        <p className="font-display text-4xl">{error.code === "plus_required" ? "Culturdle+ only" : "Hmm."}</p>
        <p className="mt-2 text-muted">{error.message}</p>
        <Link href={error.code === "plus_required" ? "/profile#plus" : "/"} className="tap mt-6 inline-flex items-center rounded-full bg-icon px-6 font-semibold text-black">
          {error.code === "plus_required" ? "See Culturdle+" : "Back to today"}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between pt-2">
        <Link href={date ? "/archive" : "/"} className="tap -ml-2 flex items-center px-2 text-muted" aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
          <span className="text-sm">{date ? "Archive" : "Today"}</span>
        </Link>
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
          {EDITION_META[edition].flag} {edition} · #{view?.puzzleNumber ?? "…"}
          {view?.archive && " · archive"}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest" style={{ color: meta.color }}>
            <span aria-hidden>{meta.emoji}</span> {meta.label}
          </p>
          <h1 className="font-display text-5xl leading-none">{view?.prompt ?? "…"}</h1>
        </div>
      </div>
      <Pips pips={view?.pips ?? []} current={!view?.finished} />

      {!view ? (
        <div className="flex animate-pulse flex-col gap-2.5">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="stub h-14" />)}</div>
      ) : (
        <>
          <HintStack hints={view.hints} color={meta.color} />

          {view.guesses.some((g) => !g.correct) && (
            <ul className="flex flex-wrap gap-2" aria-label="Your guesses">
              {view.guesses.map((g, i) =>
                g.correct ? null : (
                  <li key={i} className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
                    <span aria-hidden className="mr-1">{g.skipped ? "⬜" : "✕"}</span>
                    {g.skipped ? "Skipped" : <s>{g.text}</s>}
                  </li>
                ),
              )}
            </ul>
          )}

          {!view.finished && (
            <div className={cx("-mx-4 px-4 pb-2", view.options ? "pt-2" : "sticky bottom-24 z-10 bg-gradient-to-t from-bg via-bg to-transparent pt-6")}>
              {view.options ? (
                <div>
                  <p className="mb-2 text-center text-sm font-semibold text-options">Last guess — pick one of four</p>
                  <div className="grid grid-cols-2 gap-2">
                    {view.options.map((o) => (
                      <button key={o} disabled={busy} onClick={() => void send({ option: o })} className="stub tap px-3 py-4 text-center text-[16px] font-semibold disabled:opacity-50">
                        {o}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => void send({ skip: true })} disabled={busy} className="tap mt-2 w-full text-sm text-muted underline underline-offset-4">
                    I give up — show me
                  </button>
                </div>
              ) : (
                <GuessInput
                  edition={edition}
                  mode={mode}
                  answerType={view.answerType}
                  color={meta.color}
                  disabled={busy}
                  onGuess={(text) => send({ text })}
                  onSkip={() => void send({ skip: true })}
                />
              )}
            </div>
          )}

          {view.finished && view.reveal && (
            <section id="reveal" className="stub mt-2 scroll-mt-4 overflow-hidden" aria-live="polite">
              <div className="h-2" style={{ background: view.solved ? "var(--win)" : "var(--miss)" }} />
              <div className="px-5 pb-5 pt-4 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted">
                  {view.solved ? (view.pips.at(-1) === "options" ? "Got it from the options" : `Solved in ${view.guessesUsed}`) : "The answer was"}
                </p>
                <h2 className="font-display shimmer mt-1 text-5xl leading-[0.95]">{view.reveal.answer}</h2>
                {view.reveal.year && <p className="font-display text-2xl text-muted">{view.reveal.year}</p>}
                <p className="mt-3 text-[15px] leading-relaxed">{view.reveal.fact}</p>
                <div className="my-4 border-t-2 border-dashed border-line" />
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl" aria-label="Your guesses">{view.pips.map((p) => PIP_EMOJI[p]).join("")}</span>
                  <span className="font-display text-3xl" style={{ color: view.solved ? "var(--win)" : "var(--muted)" }}>+{view.points ?? 0} pts</span>
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {!view.archive && (
                    <ShareButton
                      text={edSummary?.share ?? ""}
                      imageUrl={`/api/share/${view.date}/${edition}/image`}
                      className="tap rounded-full bg-win px-6 font-semibold text-white"
                    />
                  )}
                  {next && (
                    <Link href={`/play/${next.edition.toLowerCase()}/${next.mode}`} className="tap inline-flex items-center rounded-full bg-text px-6 font-semibold text-bg">
                      Next: {next.edition !== edition ? `${next.edition} ` : ""}{MODE_META[next.mode].label} →
                    </Link>
                  )}
                  <button onClick={() => setReportOpen(true)} className="tap rounded-full border border-line px-4 text-sm text-muted">Report a problem</button>
                </div>
              </div>
            </section>
          )}

          {view.finished && edSummary?.complete && !view.archive && (
            <section className="rounded-2xl border border-line bg-surface p-5 text-center">
              <p className="text-sm uppercase tracking-widest text-muted">{edition} · day summary</p>
              <p className="font-display mt-1 text-4xl">{edSummary.perfect ? "🏆 Perfect Day!" : `${edSummary.score} / 18 points`}</p>
              {edSummary.perfect && <p className="text-muted">All three solved · {edSummary.score} / 18 points</p>}
              <pre className="mx-auto mt-3 inline-block whitespace-pre-wrap text-left font-sans text-[15px] leading-relaxed">{edSummary.share.split("\n").slice(1, 4).join("\n")}</pre>
              {day && day.editions.find((e) => e.edition !== edition)?.summary.finished === 0 && (
                <Link href={`/play/${edition === "India" ? "global" : "india"}/movie`} className="tap mt-3 inline-flex items-center rounded-full bg-icon px-6 font-semibold text-black">
                  Try the {edition === "India" ? "Global" : "India"} edition →
                </Link>
              )}
              {day && !next && (
                <p className="mt-4 text-muted">
                  All done for today. New puzzles in <span className="text-xl text-text"><Countdown seconds={day.secondsToReset} /></span>
                </p>
              )}
            </section>
          )}
        </>
      )}
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} edition={edition} mode={mode} date={view?.date} />
    </main>
  );
}

function ReportSheet({ open, onClose, edition, mode, date }: { open: boolean; onClose: () => void; edition: Edition; mode: Mode; date?: string }) {
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const submit = async () => {
    setState("sending");
    try {
      await api("/api/report", { method: "POST", json: { edition, mode, date, message: msg } });
      setState("sent");
      setMsg("");
    } catch {
      setState("error");
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Report a problem">
      {state === "sent" ? (
        <p className="text-muted">Thanks — we read every report and fix the reveal card fast.</p>
      ) : (
        <>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
            placeholder="A wrong fact, a hint that gives it away, a missing alias…"
            className="w-full rounded-2xl border border-line bg-bg p-3 text-[16px] outline-none"
          />
          {state === "error" && <p className="mt-1 text-sm text-movie">Could not send — try again.</p>}
          <button onClick={submit} disabled={msg.trim().length < 3 || state === "sending"} className={cx("tap mt-3 w-full rounded-2xl bg-icon font-semibold text-black disabled:opacity-40")}>
            Send report
          </button>
        </>
      )}
    </Sheet>
  );
}
