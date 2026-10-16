import { addDays, daysBetween, difficultyFor, weekday } from "./dates";
import { seededRandom } from "./random";
import type { Difficulty, Edition, Mode } from "./types";

export interface ScheduleCandidate {
  id: string;
  difficulty: Difficulty;
  answerType: string;
  /** Lowercased director, lead, artist and composer names (and the answer for icons). */
  people: string[];
}

export interface ScheduledEntry {
  date: string;
  puzzleId: string;
}

export interface ScheduleResult {
  puzzleId: string;
  difficulty: Difficulty;
  /** Which fallback step was needed: 0 none, 1 other difficulty, 2 365-day reuse, 3 relaxed rules. */
  fallback: number;
}

const ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];
const isArtist = (t: string) => /artist|band/i.test(t);

function difficultyOrder(primary: Difficulty[]): Difficulty[] {
  const rest = ORDER.filter((d) => !primary.includes(d)).sort(
    (a, b) =>
      Math.min(...primary.map((p) => Math.abs(ORDER.indexOf(p) - ORDER.indexOf(a)))) -
      Math.min(...primary.map((p) => Math.abs(ORDER.indexOf(p) - ORDER.indexOf(b)))),
  );
  return [...primary, ...rest];
}

/**
 * Pick the puzzle for one date and pool. Pure and deterministic: the same inputs always give the
 * same pick, so a re-run of the nightly job is idempotent.
 */
export function pickPuzzle(args: {
  date: string;
  edition: Edition;
  mode: Mode;
  candidates: ScheduleCandidate[];
  /** Earlier schedule for this edition and mode (any order). */
  history: ScheduledEntry[];
}): ScheduleResult | null {
  const { date, edition, mode, candidates, history } = args;
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const lastUsed = new Map<string, string>();
  for (const h of history) {
    if (daysBetween(h.date, date) <= 0) continue;
    const prev = lastUsed.get(h.puzzleId);
    if (!prev || prev < h.date) lastUsed.set(h.puzzleId, h.date);
  }
  const recent = history.filter((h) => {
    const d = daysBetween(h.date, date);
    return d > 0 && d <= 14;
  });
  const recentPeople = new Set<string>();
  for (const h of recent) for (const p of byId.get(h.puzzleId)?.people ?? []) recentPeople.add(p);
  const artistsLast6 = history.filter((h) => {
    const d = daysBetween(h.date, date);
    return d > 0 && d < 7 && isArtist(byId.get(h.puzzleId)?.answerType ?? "");
  }).length;

  const plan = difficultyFor(date);
  const order = difficultyOrder(plan.primary);
  const rand = seededRandom(`${date}|${edition}|${mode}|schedule`);

  const passes: Array<{ diffs: Difficulty[]; reuseDays: number; strict: boolean; fallback: number }> = [
    { diffs: plan.primary, reuseDays: 730, strict: true, fallback: 0 },
    ...order.slice(plan.primary.length).map((d) => ({ diffs: [d], reuseDays: 730, strict: true, fallback: 1 })),
    { diffs: order, reuseDays: 365, strict: true, fallback: 2 },
    { diffs: order, reuseDays: 365, strict: false, fallback: 3 },
  ];

  for (const pass of passes) {
    const pool = candidates.filter((c) => {
      if (!pass.diffs.includes(c.difficulty)) return false;
      const used = lastUsed.get(c.id);
      if (used && daysBetween(used, date) <= pass.reuseDays) return false;
      if (pass.strict) {
        if (c.people.some((p) => recentPeople.has(p))) return false;
        if (mode === "music" && isArtist(c.answerType) && artistsLast6 >= 2) return false;
      }
      return true;
    });
    if (pool.length === 0) continue;
    pool.sort((a, b) => (a.id < b.id ? -1 : 1));
    const pick = pool[Math.floor(rand() * pool.length)];
    return { puzzleId: pick.id, difficulty: pick.difficulty, fallback: pass.fallback };
  }
  return null;
}

/** Days of runway left: unscheduled live rows in a pool divided by one puzzle a day. */
export function runwayDays(liveCount: number, scheduledAhead: number): number {
  return Math.max(0, liveCount - scheduledAhead);
}

export { addDays, weekday };
