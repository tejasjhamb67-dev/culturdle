"use client";

import { useState } from "react";
import type { Edition } from "@culturdle/core";
import { trackClient } from "@/lib/client/api";
import { cx } from "@/lib/client/copy";
import { Wordmark } from "./Wordmark";
import { Tile } from "./Tile";
import { Button } from "./Button";

const CARDS = [
  { title: "Guess the film, the song and the icon in six tries" },
  { title: "Each miss reveals a hint" },
  { title: "Pick your edition" },
];

export function Onboarding({ onDone }: { onDone: (edition: Edition | null) => void }) {
  const [i, setI] = useState(0);
  const next = () => {
    trackClient("app_open", { onboarding_step: i + 1 });
    setI(i + 1);
  };
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),20px)]">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col">
        <div className="flex h-12 items-center justify-between">
          <Wordmark size={22} />
          {i < 2 && <button onClick={() => onDone(null)} className="h-11 px-2 text-[15px] text-muted">Skip</button>}
        </div>
        <div key={i} className="rise flex flex-1 flex-col justify-center gap-6">
          <h1 className="t-display">{CARDS[i].title}</h1>
          {i === 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-muted">Three puzzles in a Global and an India edition. Everyone gets the same six each day.</p>
              <Tile state="correct">Solved — green</Tile>
              <Tile state="present">Solved from the options — yellow</Tile>
              <Tile state="absent">Not it — grey</Tile>
            </div>
          )}
          {i === 1 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-muted">Hints start broad and get sharper. On your sixth guess, four options appear.</p>
              {["Theme: Action · 1970s", "Music by: R.D. Burman", "Directed by: Ramesh Sippy"].map((h, k) => (
                <div key={h} className="rise flex items-center gap-3 rounded-[10px] bg-surface px-3 py-2.5" style={{ animationDelay: `${k * 250}ms` }}>
                  <span className="t-label text-muted">{k + 1}</span>
                  <span className="t-chip">{h}</span>
                </div>
              ))}
              <div className="flex gap-2">
                {[4, 5, 6].map((n) => (
                  <span key={n} className="t-meta flex h-8 w-10 items-center justify-center rounded-[4px] border border-dashed border-border-strong text-muted">{n}</span>
                ))}
              </div>
            </div>
          )}
          {i === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-muted">Your home edition shows first. The other is one tap away.</p>
              <Button variant="secondary" full onClick={() => onDone("India")}>India — Bollywood, Hindi songs, Indian icons</Button>
              <Button variant="secondary" full onClick={() => onDone("Global")}>Global — Hollywood, Billboard, world icons</Button>
            </div>
          )}
        </div>
        {i < 2 && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2" aria-label={`Card ${i + 1} of 3`}>
              {CARDS.map((_, k) => <span key={k} className={cx("h-2 w-2 rounded-full", k === i ? "bg-text" : "bg-border")} />)}
            </div>
            <Button onClick={next} className="w-36">Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
