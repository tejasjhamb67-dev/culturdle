import { MAX_GUESSES, type Edition, type Mode, type PlayState } from "./types";
import { pipsFor, type Pip } from "./scoring";

export const MODE_EMOJI: Record<Mode, string> = { movie: "🎬", music: "🎵", icon: "⭐" };
export const EDITION_FLAG: Record<Edition, string> = { Global: "🌍", India: "🇮🇳" };
export const PIP_EMOJI: Record<Pip, string> = {
  miss: "⬛",
  skip: "⬜",
  win: "🟩",
  options: "🟨",
  lost: "⬛",
};
/** High-contrast mode swaps green and yellow for orange and blue, as Wordle does. */
export const PIP_EMOJI_HC: Record<Pip, string> = { ...PIP_EMOJI, win: "🟧", options: "🟦" };

export function shareRow(mode: Mode, state: PlayState | null, highContrast = false): string {
  if (!state || state.guesses.length === 0) return `${MODE_EMOJI[mode]} not played`;
  const set = highContrast ? PIP_EMOJI_HC : PIP_EMOJI;
  const pips = pipsFor(state).map((p) => set[p]).join("");
  const score = state.finished ? (state.solved ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`) : "…";
  return `${MODE_EMOJI[mode]} ${pips} ${score}`;
}

export function shareText(args: {
  puzzleNumber: number;
  edition: Edition;
  plays: Partial<Record<Mode, PlayState | null>>;
  streak: number;
  url: string;
  highContrast?: boolean;
}): string {
  const lines = [`Culturdle #${args.puzzleNumber} · ${args.edition} ${EDITION_FLAG[args.edition]}`];
  for (const m of ["movie", "music", "icon"] as Mode[]) lines.push(shareRow(m, args.plays[m] ?? null, args.highContrast));
  if (args.streak > 0) lines.push(`🔥 ${args.streak}-day streak`);
  lines.push(args.url);
  return lines.join("\n");
}
