import { cx } from "@/lib/client/copy";

export type Status = "play" | "in_progress" | "solved" | "missed" | "options";

export function statusText(status: Status, guesses: number) {
  switch (status) {
    case "play": return "Not started";
    case "in_progress": return "In progress";
    case "solved": return `Solved in ${guesses}`;
    case "options": return "Solved in 6";
    case "missed": return "Missed";
  }
}

export function StatusPill({ status, guesses, className }: { status: Status; guesses: number; className?: string }) {
  const tone =
    status === "solved" ? "bg-correct text-on-correct" :
    status === "options" ? "bg-correct text-on-correct" :
    status === "in_progress" ? "bg-present text-on-present" :
    status === "missed" ? "bg-absent text-on-absent" : "text-muted";
  return <span className={cx("t-meta inline-flex h-7 items-center rounded-full px-3 font-semibold", tone, className)}>{statusText(status, guesses)}</span>;
}

/** Small dot used inside the mode switch: green solved, yellow in progress, grey missed. */
export function StatusDot({ status }: { status: Status }) {
  if (status === "play") return null;
  const tone = status === "solved" || status === "options" ? "bg-correct" : status === "in_progress" ? "bg-present" : "bg-absent";
  return <span aria-hidden className={cx("h-1.5 w-1.5 rounded-full", tone)} />;
}
