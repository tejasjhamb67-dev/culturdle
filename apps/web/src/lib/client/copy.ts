import type { Edition, Mode } from "@culturdle/core";

export const MODE_LABEL: Record<Mode, string> = { movie: "Movie", music: "Music", icon: "Icon" };

export const EDITION_SLUG: Record<Edition, string> = { Global: "global", India: "india" };
export const editionFromSlug = (s: string): Edition | null => (s === "global" ? "Global" : s === "india" ? "India" : null);
export const modeFromSlug = (s: string): Mode | null => (s === "movie" || s === "music" || s === "icon" ? s : null);
export const playHref = (edition: Edition, mode: Mode, date?: string | null) => `/${EDITION_SLUG[edition]}/${mode}${date ? `?date=${date}` : ""}`;

/** "Guess the film" → "Type a film…" */
export function placeholderFor(prompt: string): string {
  const noun = prompt.replace(/^Guess the /i, "");
  return `Type a${/^[aeiou]/i.test(noun) ? "n" : ""} ${noun}…`;
}

/** Verdict words by guess count (voice: short, warm, film-and-music flavoured). */
export const VERDICTS = ["Blockbuster", "Standing ovation", "Box-office hit", "Crowd-pleaser", "Sleeper hit", "Cult classic"];
export const verdictFor = (solved: boolean | null, guesses: number) => (solved ? VERDICTS[Math.min(5, guesses - 1)] : "Roll credits");

export const COPY = {
  notInList: (noun: string) => `Pick a${/^[aeiou]/i.test(noun) ? "n" : ""} ${noun} from the list`,
  repeat: "Already guessed",
  offline: "You're offline. Your board is saved.",
  copied: "Copied to clipboard",
  emptyFriends: "Culturdle is better with friends. Share your invite link.",
  countdown: "Next Culturdle in",
};

export function formatCountdown(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function longDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
