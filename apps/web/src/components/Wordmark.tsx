import { cx } from "@/lib/client/copy";

const LETTERS = "CULTURDLE".split("");
const STATES = ["correct", "present", "absent", "correct", "present", "correct", "absent", "correct", "present"] as const;
const CLS = {
  correct: "bg-correct text-on-correct",
  present: "bg-present text-on-present",
  absent: "bg-absent text-on-absent",
};

/** The word CULTURDLE set in tiles: the only logo (Foodle §3.5). */
export function Wordmark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={cx("inline-flex", className)} style={{ gap: Math.round(size * 0.14) }} aria-label="Culturdle" role="img">
      {LETTERS.map((l, i) => (
        <span
          key={i}
          aria-hidden
          className={cx("flex items-center justify-center font-extrabold", CLS[STATES[i]])}
          style={{ width: size, height: size, borderRadius: 3, fontSize: Math.round(size * 0.58), lineHeight: 1 }}
        >
          {l}
        </span>
      ))}
    </span>
  );
}
