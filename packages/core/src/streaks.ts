import { addDays, daysBetween } from "./dates";

export interface StreakState {
  current: number;
  best: number;
  freezes: number;
  lastPlayDate: string | null;
}

export const FREEZE_EVERY = 7;
export const MAX_FREEZES_FREE = 2;
export const MAX_FREEZES_PLUS = 5;

export function emptyStreak(): StreakState {
  return { current: 0, best: 0, freezes: 0, lastPlayDate: null };
}

/**
 * Record that the player finished a puzzle on `date`. Missed days in between are covered by
 * banked freezes (used automatically) when there are enough; otherwise the streak restarts.
 */
export function recordPlayDay(
  state: StreakState,
  date: string,
  maxFreezes = MAX_FREEZES_FREE,
): { state: StreakState; freezesUsed: number; freezeEarned: boolean } {
  if (state.lastPlayDate === date) return { state, freezesUsed: 0, freezeEarned: false };
  if (state.lastPlayDate && daysBetween(state.lastPlayDate, date) < 0) {
    return { state, freezesUsed: 0, freezeEarned: false };
  }
  let { current, freezes } = state;
  let freezesUsed = 0;
  if (!state.lastPlayDate) {
    current = 1;
  } else {
    const missed = daysBetween(state.lastPlayDate, date) - 1;
    if (missed === 0) current += 1;
    else if (missed <= freezes) {
      freezes -= missed;
      freezesUsed = missed;
      current += 1;
    } else current = 1;
  }
  let freezeEarned = false;
  if (current > 0 && current % FREEZE_EVERY === 0 && freezes < maxFreezes) {
    freezes += 1;
    freezeEarned = true;
  }
  return {
    state: { current, best: Math.max(state.best, current), freezes, lastPlayDate: date },
    freezesUsed,
    freezeEarned,
  };
}

/** The streak as it stands today (0 when it has lapsed beyond what freezes can cover). */
export function displayStreak(state: StreakState, today: string): number {
  if (!state.lastPlayDate) return 0;
  const gap = daysBetween(state.lastPlayDate, today);
  if (gap <= 1) return state.current;
  return gap - 1 <= state.freezes ? state.current : 0;
}

/** Yesterday helper for callers. */
export const yesterday = (date: string) => addDays(date, -1);
