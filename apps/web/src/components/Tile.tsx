import { cx } from "@/lib/client/copy";

export type TileState = "correct" | "present" | "absent" | "empty" | "skipped";
const GLYPH: Partial<Record<TileState, string>> = { correct: "✓", present: "~", absent: "×" };
const CLS: Record<TileState, string> = {
  correct: "bg-correct text-on-correct",
  present: "bg-present text-on-present",
  absent: "bg-absent text-on-absent",
  empty: "border border-dashed border-border",
  skipped: "border-2 border-border text-muted",
};

/** A board tile: 46 px tall, radius 4, corner glyph so colour is never the only signal (Foodle §2.3). */
export function Tile({ state, children, className, label, animate }: { state: TileState; children?: React.ReactNode; className?: string; label?: string; animate?: boolean }) {
  return (
    <div aria-label={label} className={cx("relative flex h-[46px] items-center justify-center rounded-[4px] px-3 text-center", CLS[state], animate && "flip", className)}>
      {GLYPH[state] && <span aria-hidden className="absolute right-1.5 top-0.5 text-[8.5px] font-bold">{GLYPH[state]}</span>}
      <span className="t-tile line-clamp-2">{children}</span>
    </div>
  );
}

/** Six mini squares for leaderboards and history. */
export function MiniSquares({ states, size = 14 }: { states: TileState[]; size?: number }) {
  return (
    <span className="inline-flex gap-[3px]" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => {
        const s = states[i] ?? "empty";
        return <span key={i} className={cx("rounded-[2px]", s === "empty" || s === "skipped" ? "border border-border" : CLS[s])} style={{ width: size, height: size }} />;
      })}
    </span>
  );
}
