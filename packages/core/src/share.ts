import { MAX_GUESSES, type Edition, type Mode, type PlayState } from "./types";
import { pipsFor, type Pip } from "./scoring";

export const MODE_EMOJI: Record<Mode, string> = { movie: "🎬", music: "🎵", icon: "⭐" };
export const EDITION_FLAG: Record<Edition, string> = { Global: "🌍", India: "🇮🇳" };
export const PIP_EMOJI: Record<Pip, string> = {
  miss: "🟥",
  skip: "⬜",
  win: "🟩",
  options: "🟨",
  lost: "⬛",
};

export function shareRow(mode: Mode, state: PlayState | null): string {
  if (!state || state.guesses.length === 0) return `${MODE_EMOJI[mode]} not played`;
  const pips = pipsFor(state).map((p) => PIP_EMOJI[p]).join("");
  const score = state.finished ? (state.solved ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`) : "…";
  return `${MODE_EMOJI[mode]} ${pips} ${score}`;
}

export function shareText(args: {
  puzzleNumber: number;
  edition: Edition;
  plays: Partial<Record<Mode, PlayState | null>>;
  streak: number;
  url: string;
}): string {
  const lines = [`Culturdle #${args.puzzleNumber} · ${args.edition} ${EDITION_FLAG[args.edition]}`];
  for (const m of ["movie", "music", "icon"] as Mode[]) lines.push(shareRow(m, args.plays[m] ?? null));
  if (args.streak > 0) lines.push(`🔥 ${args.streak}-day streak`);
  lines.push(args.url);
  return lines.join("\n");
}
