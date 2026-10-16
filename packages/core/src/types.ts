export type Edition = "Global" | "India";
export type Mode = "movie" | "music" | "icon";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type PuzzleStatus = "draft" | "reviewed" | "live" | "retired";

export const EDITIONS: Edition[] = ["Global", "India"];
export const MODES: Mode[] = ["movie", "music", "icon"];
export const MAX_GUESSES = 6;

export interface Puzzle {
  id: string;
  edition: Edition;
  mode: Mode;
  answerType: string;
  category: string | null;
  difficulty: Difficulty;
  answer: string;
  aliases: string[];
  year: number | null;
  hints: string[];
  wrongOptions: string[];
  revealFact: string | null;
  meta: Record<string, string>;
  source: string | null;
  verifyFlag: string | null;
  status: PuzzleStatus;
}

export interface GuessRecord {
  text: string;
  correct: boolean;
  skipped: boolean;
  option?: boolean;
  at: string;
}

/** State of one player's attempt at one puzzle. */
export interface PlayState {
  guesses: GuessRecord[];
  usedOptions: boolean;
  solved: boolean | null;
  finished: boolean;
  points: number | null;
}
