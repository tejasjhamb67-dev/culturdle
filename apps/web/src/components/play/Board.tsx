"use client";

import { useEffect, useRef } from "react";
import type { PuzzleView } from "@/lib/client/types";
import { cx } from "@/lib/client/copy";
import { Tile, type TileState } from "../Tile";

export function rowStates(view: Pick<PuzzleView, "guesses">): TileState[] {
  return view.guesses.map((g) => (g.correct ? (g.option ? "present" : "correct") : g.skipped ? "skipped" : "absent"));
}

/** Six rows, one per guess. A guess is one wide tile; unused guesses are dashed outlines. */
export function Board({ view, shake }: { view: PuzzleView; shake: boolean }) {
  const prev = useRef(view.guesses.length);
  const newest = view.guesses.length > prev.current ? view.guesses.length - 1 : -1;
  useEffect(() => {
    prev.current = view.guesses.length;
  }, [view.guesses.length]);
  const states = rowStates(view);
  return (
    <ol className={cx("flex flex-col gap-1.5", view.finished && !view.solved && "opacity-60 transition-opacity duration-300")} aria-label="Your guesses">
      {Array.from({ length: view.maxGuesses }).map((_, i) => {
        const g = view.guesses[i];
        const isNext = i === view.guesses.length && !view.finished;
        if (!g) {
          return (
            <li key={i} className={cx(isNext && shake && "shake")}>
              <Tile state="empty" className={cx(isNext && "border-border-strong")} label={`Guess ${i + 1}: unused`}>
                {isNext && view.options ? <span className="font-semibold text-muted">Pick one of the four options</span> : null}
              </Tile>
            </li>
          );
        }
        const st = states[i];
        const word = st === "correct" ? "solved" : st === "present" ? "solved from the options" : st === "skipped" ? "skipped" : "not it";
        return (
          <li key={i}>
            <Tile state={st} animate={i === newest} className={cx(g.correct && i === newest && "bounce")} label={`Guess ${i + 1}: ${g.skipped ? "skipped" : g.text}, ${word}`}>
              {g.skipped ? "Skipped" : g.text}
            </Tile>
          </li>
        );
      })}
    </ol>
  );
}
