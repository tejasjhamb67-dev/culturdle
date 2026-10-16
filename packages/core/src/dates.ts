import type { Difficulty } from "./types";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** IST calendar date (YYYY-MM-DD) for an instant. */
export function istDate(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Seconds until the next 00:00 IST. */
export function secondsToNextReset(now: Date = new Date()): number {
  const ist = now.getTime() + IST_OFFSET_MS;
  const next = Math.floor(ist / DAY_MS) * DAY_MS + DAY_MS;
  return Math.max(0, Math.ceil((next - ist) / 1000));
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday for an IST calendar date. */
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Monday (IST) of the week containing date. */
export function weekStart(date: string): string {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

/** Puzzle number: days since launch, starting at 1. */
export function puzzleNumber(date: string, launchDate: string): number {
  return daysBetween(launchDate, date) + 1;
}

export type DayPlan = { primary: Difficulty[]; cultClassic: boolean };

/** Weekly difficulty curve. */
export function difficultyFor(date: string): DayPlan {
  switch (weekday(date)) {
    case 1: case 2: case 3: return { primary: ["Easy"], cultClassic: false };
    case 4: case 5: return { primary: ["Medium"], cultClassic: false };
    case 6: return { primary: ["Hard"], cultClassic: false };
    default: return { primary: ["Easy", "Medium"], cultClassic: true };
  }
}
