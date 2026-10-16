"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, ChevronLeft } from "lucide-react";
import type { Edition, Mode } from "@culturdle/core";
import { api, ApiError } from "@/lib/client/api";
import type { PuzzleView } from "@/lib/client/types";
import { COPY, longDate, MODE_LABEL, placeholderFor, playHref } from "@/lib/client/copy";
import { useShell, tileStatus } from "@/components/Shell";
import { Segmented } from "@/components/Segmented";
import { StatusDot } from "@/components/StatusPill";
import { HintStrip } from "@/components/play/HintStrip";
import { Board } from "@/components/play/Board";
import { GuessInput } from "@/components/play/GuessInput";
import { Options } from "@/components/play/Options";
import { AnswerCard } from "@/components/play/AnswerCard";
import { LeftRail, RightRail } from "@/components/play/Rails";
import { ReportSheet } from "@/components/ReportSheet";
import { useToast } from "@/components/Toast";
import { ButtonLink } from "@/components/Button";

export function Play({ edition, mode }: { edition: Edition; mode: Mode }) {
  const router = useRouter();
  const date = useSearchParams().get("date");
  const { day, refreshDay, setCurrent, openStats } = useShell();
  const [view, setView] = useState<PuzzleView | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [candidates, setCandidates] = useState<string[] | null>(null);
  const [report, setReport] = useState(false);
  const toast = useToast();
  const qs = date ? `?date=${date}` : "";

  useEffect(() => {
    if (!date) setCurrent(edition, mode);
  }, [edition, mode, date, setCurrent]);

  useEffect(() => {
    let live = true;
    setView(null);
    setError(null);
    api<PuzzleView>(`/api/play/${edition}/${mode}${qs}`)
      .then((v) => live && setView(v))
      .catch((e: ApiError) => live && setError({ code: e.code, message: e.message }));
    return () => {
      live = false;
    };
  }, [edition, mode, qs]);

  const noun = (view?.prompt ?? "Guess the answer").replace(/^Guess the /i, "");

  const send = useCallback(
    async (payload: Record<string, unknown>): Promise<boolean> => {
      setBusy(true);
      try {
        const r = await api<{ puzzle: PuzzleView }>(`/api/play/${edition}/${mode}/guess`, { method: "POST", json: { ...payload, ...(date ? { date } : {}) } });
        setView(r.puzzle);
        setCandidates(null);
        void refreshDay();
        return true;
      } catch (e) {
        if (!(e instanceof ApiError)) {
          toast.show(COPY.offline);
          return false;
        }
        const err = e;
        if (err.code === "finished") {
          window.location.reload();
          return false;
        }
        setShake(true);
        setTimeout(() => setShake(false), 460);
        if (err.code === "not_in_list") toast.show(COPY.notInList(noun));
        else if (err.code === "repeat") toast.show(COPY.repeat);
        else if (err.code === "ambiguous") {
          toast.show("Did you mean one of these?");
          setCandidates(err.data?.candidates ?? null);
        } else toast.show(err.message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [edition, mode, date, refreshDay, toast, noun],
  );

  const ed = day?.editions.find((e) => e.edition === edition);
  const next = useMemo(() => {
    if (!day || date) return null;
    const order = [...day.editions].sort((a) => (a.edition === edition ? -1 : 1));
    for (const e of order)
      for (const t of e.tiles)
        if ((t.status === "play" || t.status === "in_progress") && !(e.edition === edition && t.mode === mode))
          return { href: playHref(e.edition, t.mode), label: `Next: ${e.edition === edition ? "" : `${e.edition} `}${MODE_LABEL[t.mode].toLowerCase()}` };
    return null;
  }, [day, edition, mode, date]);

  const otherEdition: Edition = edition === "India" ? "Global" : "India";
  const guessesLeft = view ? view.maxGuesses - view.guessesUsed : 6;

  return (
    <>
      {toast.node}
      <main className="mx-auto w-full max-w-[1440px] lg:grid lg:grid-cols-[260px_minmax(0,520px)_300px] lg:justify-between lg:gap-10 lg:px-8 lg:pt-10">
        <LeftRail edition={edition} mode={mode} />

        <section className="mx-auto w-full max-w-[520px] px-4 pb-44 pt-4 lg:px-0 lg:pb-16 lg:pt-0">
          {date ? (
            <Link href="/archive" className="t-meta -ml-1 mb-3 inline-flex h-8 items-center gap-1 text-muted"><ChevronLeft size={16} /> Archive</Link>
          ) : (
            <Segmented
              size="lg"
              className="mb-4 lg:hidden"
              label="Mode"
              value={mode}
              onChange={(m) => router.push(playHref(edition, m))}
              options={(["movie", "music", "icon"] as Mode[]).map((m) => ({
                value: m,
                label: MODE_LABEL[m],
                badge: <StatusDot status={tileStatus(ed?.tiles.find((t) => t.mode === m))} />,
              }))}
            />
          )}

          <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px]">
            <span className="font-bold">No. {view?.puzzleNumber ?? ed?.puzzleNumber ?? "…"}</span>
            <span className="text-muted">{longDate(view?.date ?? date ?? day?.date ?? new Date().toISOString().slice(0, 10))}</span>
            <span className="text-muted">·</span>
            <span className="text-muted lg:hidden">{edition} edition</span>
            <span className="hidden text-muted lg:inline">{MODE_LABEL[mode]} · {edition} edition</span>
            {!date && (
              <Link href={playHref(otherEdition, mode)} className="ml-auto inline-flex h-8 items-center gap-1 text-[13px] font-semibold text-muted underline-offset-4 hover:underline lg:hidden">
                <ArrowLeftRight size={14} aria-hidden /> {otherEdition}
              </Link>
            )}
          </div>

          {error ? (
            <div className="mt-10 text-center">
              <p className="t-title">{error.code === "plus_required" ? "Archive is part of Culturdle+" : "Something went wrong"}</p>
              <p className="mt-2 text-muted">{error.message}</p>
              <div className="mx-auto mt-6 max-w-xs">
                <ButtonLink full variant="secondary" href={error.code === "plus_required" ? "/settings#plus" : "/"}>{error.code === "plus_required" ? "About Culturdle+" : "Back to today"}</ButtonLink>
              </div>
            </div>
          ) : !view ? (
            <BoardSkeleton />
          ) : (
            <div className="flex flex-col gap-6">
              <h1 className="t-headline -mb-3">{view.prompt}</h1>
              <HintStrip hints={view.hints} />
              {view.finished && view.reveal ? (
                <AnswerCard
                  view={view}
                  share={ed?.summary.share}
                  next={next}
                  secondsToReset={day?.secondsToReset}
                  onStats={() => openStats(edition, mode)}
                  onReport={() => setReport(true)}
                  onToast={toast.show}
                  onZero={refreshDay}
                />
              ) : (
                <>
                  <Board view={view} shake={shake} />
                  {/* desktop: input directly under the board */}
                  <div className="hidden lg:block">
                    <InputArea view={view} edition={edition} mode={mode} busy={busy} send={send} candidates={candidates} />
                    <p className="t-meta mt-3 text-center text-muted">
                      {view.options ? `${guessesLeft} guess left` : "Enter to guess · ↑ ↓ to pick · Esc to clear"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <RightRail />
      </main>

      {/* phone/tablet: input pinned to the bottom */}
      {view && !view.finished && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 lg:hidden">
          <div className="mx-auto max-w-[520px]">
            <InputArea view={view} edition={edition} mode={mode} busy={busy} send={send} candidates={candidates} />
            <p className="t-meta mt-2 text-center text-muted">{guessesLeft} guess{guessesLeft === 1 ? "" : "es"} left</p>
          </div>
        </div>
      )}
      <ReportSheet open={report} onClose={() => setReport(false)} edition={edition} mode={mode} date={view?.date} />
    </>
  );
}

function InputArea({ view, edition, mode, busy, send, candidates }: {
  view: PuzzleView; edition: Edition; mode: Mode; busy: boolean; candidates: string[] | null;
  send: (p: Record<string, unknown>) => Promise<boolean>;
}) {
  if (view.options) {
    return <Options options={view.options} disabled={busy} onPick={(o) => void send({ option: o })} onGiveUp={() => void send({ skip: true })} />;
  }
  return (
    <div>
      <GuessInput
        edition={edition}
        mode={mode}
        answerType={view.answerType}
        placeholder={placeholderFor(view.prompt)}
        disabled={busy}
        candidates={candidates}
        autoFocus
        onGuess={(text) => send({ text })}
      />
      <div className="mt-1 flex justify-end">
        <button onClick={() => void send({ skip: true })} disabled={busy} className="t-meta h-8 px-1 text-muted underline underline-offset-4">Skip — show the next hint</button>
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-1.5" aria-hidden>
      <div className="mb-4 h-24 rounded-[10px] bg-surface" />
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[46px] rounded-[4px] border border-dashed border-border" />)}
    </div>
  );
}
