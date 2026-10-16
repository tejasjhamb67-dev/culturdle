import type { Edition, Mode, Pip } from "@culturdle/core";

export interface PuzzleView {
  date: string;
  edition: Edition;
  mode: Mode;
  puzzleNumber: number;
  answerType: string;
  prompt: string;
  hints: string[];
  guesses: { text: string; correct: boolean; skipped: boolean; option?: boolean }[];
  pips: Pip[];
  guessesUsed: number;
  maxGuesses: number;
  finished: boolean;
  solved: boolean | null;
  points: number | null;
  options: string[] | null;
  reveal: { answer: string; year: number | null; fact: string | null; category: string | null } | null;
  archive: boolean;
}

export interface Tile {
  mode: Mode;
  prompt: string;
  status: "play" | "in_progress" | "solved" | "missed";
  guessesUsed: number;
  points: number | null;
  pips: Pip[];
}

export interface DayView {
  date: string;
  secondsToReset: number;
  streak: { current: number; best: number; freezes: number };
  homeEdition: Edition;
  editions: {
    edition: Edition;
    puzzleNumber: number;
    tiles: Tile[];
    summary: { finished: number; complete: boolean; score: number; perfect: boolean; share: string };
  }[];
}

export interface Me {
  id: string;
  name: string;
  handle: string | null;
  friendCode: string;
  homeEdition: Edition;
  reminderTime: string | null;
  isGuest: boolean;
  isPlus: boolean;
  streak: { current: number; best: number; freezes: number };
}

export interface LeagueRow { rank: number; playerId: string; name: string; score: number; streak: number; me: boolean }
