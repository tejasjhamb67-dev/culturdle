import { addDays, EDITIONS, istDate, MODES, type Edition, type Mode } from "@culturdle/core";
import { query } from "./db";
import type { Player } from "./player";

interface FinishedPlay {
  play_date: string;
  edition: Edition;
  mode: Mode;
  solved: boolean;
  guess_count: number;
  points: number;
  used_options: boolean;
}

export async function statsFor(player: Player) {
  const rows = await query<FinishedPlay>(
    `select play_date::text as play_date, edition, mode, solved, guess_count, points, used_options
     from plays where player_id = $1 and finished_at is not null and not is_archive order by play_date`,
    [player.id],
  );
  const today = istDate();
  const perPool = EDITIONS.flatMap((edition) =>
    MODES.map((mode) => {
      const rs = rows.filter((r) => r.edition === edition && r.mode === mode);
      const solved = rs.filter((r) => r.solved);
      const distribution = [1, 2, 3, 4, 5, 6].map((n) => solved.filter((r) => r.guess_count === n).length);
      // Mode win streak: consecutive days solved, ending today or yesterday.
      const solvedDates = new Set(solved.map((r) => r.play_date));
      let winStreak = 0;
      let d = solvedDates.has(today) ? today : addDays(today, -1);
      while (solvedDates.has(d)) { winStreak++; d = addDays(d, -1); }
      let best = 0, run = 0, prev: string | null = null;
      for (const r of rs) {
        if (r.solved) {
          run = prev && addDays(prev, 1) === r.play_date ? run + 1 : 1;
          prev = r.play_date;
          best = Math.max(best, run);
        } else { run = 0; prev = null; }
      }
      return {
        edition, mode,
        played: rs.length,
        solved: solved.length,
        solveRate: rs.length ? Math.round((solved.length / rs.length) * 100) : 0,
        viaOptions: solved.filter((r) => r.used_options && r.guess_count === 6).length,
        distribution,
        failed: rs.length - solved.length,
        points: rs.reduce((a, r) => a + r.points, 0),
        winStreak,
        bestWinStreak: best,
      };
    }),
  );
  const byDayEdition = new Map<string, FinishedPlay[]>();
  for (const r of rows) {
    const k = `${r.play_date}|${r.edition}`;
    byDayEdition.set(k, [...(byDayEdition.get(k) ?? []), r]);
  }
  const perfectDays = Object.fromEntries(
    EDITIONS.map((e) => [e, [...byDayEdition.entries()].filter(([k, v]) => k.endsWith(e) && v.length === 3 && v.every((r) => r.solved)).length]),
  );
  // Detailed (Culturdle+): solve rate by decade of the answer.
  let byDecade: { decade: string; played: number; solved: number }[] | null = null;
  if (player.is_plus) {
    byDecade = await query(
      `select coalesce((floor(p.year / 10) * 10)::int::text || 's', 'n/a') as decade,
              count(*)::int as played, count(*) filter (where pl.solved)::int as solved
       from plays pl join puzzles p on p.id = pl.puzzle_id
       where pl.player_id = $1 and pl.finished_at is not null group by 1 order by 1`,
      [player.id],
    );
  }
  return {
    totals: {
      played: rows.length,
      solved: rows.filter((r) => r.solved).length,
      points: rows.reduce((a, r) => a + r.points, 0),
      daysPlayed: new Set(rows.map((r) => r.play_date)).size,
    },
    perPool,
    perfectDays,
    byDecade,
  };
}

export const FREE_SHELF_LIMIT = 24;

export async function shelfFor(player: Player) {
  const items = await query<{ play_date: string; edition: Edition; mode: Mode; answer: string; year: number | null; answer_type: string; category: string | null; guess_count: number }>(
    `select pl.play_date::text as play_date, pl.edition, pl.mode, p.answer, p.year, p.answer_type, p.category, pl.guess_count
     from plays pl join puzzles p on p.id = pl.puzzle_id
     where pl.player_id = $1 and pl.solved order by pl.play_date desc, pl.edition, pl.mode`,
    [player.id],
  );
  const total = items.length;
  const shown = player.is_plus ? items : items.slice(0, FREE_SHELF_LIMIT);
  return {
    total,
    limited: !player.is_plus && total > FREE_SHELF_LIMIT,
    items: shown.map((i) => ({ ...i, decade: i.year ? `${Math.floor(i.year / 10) * 10}s` : null })),
  };
}
