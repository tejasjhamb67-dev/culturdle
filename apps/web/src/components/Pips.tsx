import type { Pip } from "@culturdle/core";
import { cx } from "@/lib/client/ui";

const PIP_STYLE: Record<Pip, { cls: string; glyph: string; label: string }> = {
  miss: { cls: "bg-movie/90 text-white", glyph: "✕", label: "missed guess" },
  skip: { cls: "bg-miss text-muted", glyph: "–", label: "skipped" },
  win: { cls: "bg-win text-white", glyph: "✓", label: "solved" },
  options: { cls: "bg-options text-black", glyph: "◆", label: "solved from the options" },
  lost: { cls: "bg-black/60 border border-miss text-muted", glyph: "✕", label: "not solved" },
};

export function Pips({ pips, total = 6, size = "md", current }: { pips: Pip[]; total?: number; size?: "sm" | "md"; current?: boolean }) {
  const dim = size === "sm" ? "h-3 w-3 text-[0px] rounded-[3px]" : "h-7 w-7 text-xs rounded-md";
  return (
    <ol className={cx("flex", size === "sm" ? "gap-[3px]" : "gap-1.5")} aria-label={`${pips.length} of ${total} guesses used`}>
      {Array.from({ length: total }).map((_, i) => {
        const p = pips[i];
        const st = p ? PIP_STYLE[p] : null;
        return (
          <li
            key={i}
            aria-label={st ? `Guess ${i + 1}: ${st.label}` : `Guess ${i + 1}: unused`}
            className={cx(
              "flex items-center justify-center font-bold",
              dim,
              st ? cx(st.cls, "pop") : "border border-line bg-surface-2",
              !p && current && i === pips.length && "border-icon",
            )}
          >
            {st?.glyph}
          </li>
        );
      })}
    </ol>
  );
}
