"use client";

import { useState } from "react";
import type { Edition } from "@culturdle/core";
import { Marquee } from "./Header";
import { cx } from "@/lib/client/ui";

const CARDS = [
  { title: "Six puzzles a day", body: "A movie, a song and an icon — in a Global and an India edition. Everyone gets the same six.", art: ["🎬", "🎵", "⭐"] },
  { title: "A new hint after every miss", body: "Hints start vague and get clearer. Typos never cost a guess — pick from the list.", art: ["1", "2", "3"] },
  { title: "Options on your last guess", body: "Guess six shows four choices, so nobody leaves empty-handed. Then a countdown to tomorrow.", art: ["A", "B", "C", "D"] },
];

export function Onboarding({ onDone }: { onDone: (edition: Edition) => void }) {
  const [i, setI] = useState(0);
  const last = i === CARDS.length;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg px-6 pb-10 pt-[max(env(safe-area-inset-top),24px)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Marquee n={11} />
        <h1 className="font-display mt-3 text-center text-5xl">CULTURDLE</h1>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {!last ? (
            <div key={i} className="hint-new">
              <div className="mb-8 flex justify-center gap-3">
                {CARDS[i].art.map((a, k) => (
                  <span key={k} className="stub font-display flex h-20 w-16 items-center justify-center text-3xl" style={{ color: ["var(--movie)", "var(--music)", "var(--icon)", "var(--win)"][k] }}>
                    {a}
                  </span>
                ))}
              </div>
              <h2 className="font-display text-4xl">{CARDS[i].title}</h2>
              <p className="mt-3 text-lg text-muted">{CARDS[i].body}</p>
            </div>
          ) : (
            <div className="hint-new w-full">
              <h2 className="font-display text-4xl">Pick your home edition</h2>
              <p className="mt-2 text-muted">It shows first. The other is one tap away.</p>
              <div className="mt-8 grid gap-3">
                {(["India", "Global"] as Edition[]).map((e) => (
                  <button key={e} onClick={() => onDone(e)} className="stub tap flex items-center gap-4 px-6 py-5 text-left">
                    <span className="text-4xl">{e === "India" ? "🇮🇳" : "🌍"}</span>
                    <span>
                      <span className="font-display block text-3xl">{e}</span>
                      <span className="text-sm text-muted">{e === "India" ? "Bollywood, Hindi songs, Indian icons" : "Hollywood, Billboard hits, global icons"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {!last && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2" aria-hidden>
              {CARDS.map((_, k) => <span key={k} className={cx("h-2 rounded-full transition-all", k === i ? "w-6 bg-icon" : "w-2 bg-miss")} />)}
            </div>
            <button onClick={() => setI(i + 1)} className="tap rounded-full bg-icon px-7 py-3 font-semibold text-black">
              {i === CARDS.length - 1 ? "Get started" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
