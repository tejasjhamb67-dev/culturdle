"use client";

import { Button } from "../Button";

/** Guess six: the input is replaced by four options (2 × 2). */
export function Options({ options, disabled, onPick, onGiveUp }: { options: string[]; disabled?: boolean; onPick: (o: string) => void; onGiveUp: () => void }) {
  return (
    <div>
      <p className="t-label mb-2 text-center text-muted">Last guess — pick one of four</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <Button key={o} variant="secondary" size="md" disabled={disabled} onClick={() => onPick(o)} className="!h-auto min-h-12 py-2 text-[15px] leading-5">
            {o}
          </Button>
        ))}
      </div>
      <div className="mt-1 text-center">
        <button onClick={onGiveUp} disabled={disabled} className="h-11 px-3 text-[15px] text-muted underline underline-offset-4">Give up</button>
      </div>
    </div>
  );
}
