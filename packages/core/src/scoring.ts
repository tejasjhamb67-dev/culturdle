import { MAX_GUESSES, type GuessRecord, type PlayState } from "./types";

/** Points for a solve on guess n (1-based): 6,5,4,3,2,1; 0 if unsolved. */
export function pointsFor(solved: boolean, guessCount: number): number {
  if (!solved) return 0;
  return Math.max(0, MAX_GUESSES + 1 - guessCount);
}

/** Number of hints a player can see given their guesses so far. */
export function hintsVisible(guessesUsed: number, finished: boolean): number {
  if (finished) return MAX_GUESSES;
  return Math.min(MAX_GUESSES, guessesUsed + 1);
}

/** Options are shown once the player is on their sixth guess. */
export function optionsVisible(guessesUsed: number, finished: boolean): boolean {
  return finished || guessesUsed >= MAX_GUESSES - 1;
}

export function emptyPlay(): PlayState {
  return { guesses: [], usedOptions: false, solved: null, finished: false, points: null };
}

/** Apply a resolved guess to a play state and return the new state. */
export function applyGuess(
  state: PlayState,
  guess: { text: string; correct: boolean; skipped: boolean; option?: boolean },
  at: string,
): PlayState {
  if (state.finished) throw new Error("Puzzle already finished");
  const rec: GuessRecord = { text: guess.text, correct: guess.correct, skipped: guess.skipped, at };
  if (guess.option) rec.option = true;
  const guesses = [...state.guesses, rec];
  const usedOptions = state.usedOptions || !!guess.option;
  const finished = guess.correct || guesses.length >= MAX_GUESSES;
  const solved = finished ? guess.correct : null;
  const points = finished ? pointsFor(!!solved, guesses.length) : null;
  return { guesses, usedOptions, solved, finished, points };
}

export type Pip = "miss" | "skip" | "win" | "options" | "lost";

/** Per-guess pips for the result row / share block. */
export function pipsFor(state: PlayState): Pip[] {
  return state.guesses.map((g, i) => {
    const last = i === state.guesses.length - 1;
    if (g.correct) return g.option ? "options" : "win";
    if (last && state.finished && !state.solved) return "lost";
    return g.skipped ? "skip" : "miss";
  });
}
