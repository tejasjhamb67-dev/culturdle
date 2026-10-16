import {
  addDays, daysBetween, EDITIONS, istDate, MODES, pickPuzzle, puzzleNumber,
  type Edition, type Mode, type ScheduleCandidate,
} from "@culturdle/core";
import { query } from "./db";
import { LAUNCH_DATE, RUNWAY_ALERT_DAYS, SCHEDULE_DAYS_AHEAD } from "./config";

export interface SlotRow {
  play_date: string;
  edition: Edition;
  mode: Mode;
  puzzle_id: string;
  puzzle_number: number;
}

const people = (meta: Record<string, string>, answer: string, mode: Mode): string[] => {
  const out = new Set<string>();
  for (const k of ["director", "lead", "artist", "music"]) {
    const v = meta?.[k];
    if (!v) continue;
    for (const part of v.split(/\s*(?:&|,| and | feat\.? | featuring | x )\s*/i)) {
      const p = part.trim().toLowerCase();
      if (p.length > 2) out.add(p);
    }
  }
  if (mode === "icon") out.add(answer.toLowerCase());
  return [...out];
};

const dateStr = (d: unknown): string => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

let running: Promise<{ added: number; alerts: string[] }> | null = null;

/** Keep the schedule filled through `through` (default: today + 60 days) for every pool. */
export function ensureSchedule(through = addDays(istDate(), SCHEDULE_DAYS_AHEAD)) {
  if (!running) running = fill(through).finally(() => (running = null));
  return running;
}

async function fill(through: string) {
  let added = 0;
  const alerts: string[] = [];
  for (const edition of EDITIONS) {
    for (const mode of MODES) {
      const [{ last }] = await query<{ last: string | null }>(
        `select max(play_date)::text as last from schedule where edition = $1 and mode = $2`,
        [edition, mode],
      );
      let start = last ? addDays(last, 1) : LAUNCH_DATE;
      if (daysBetween(start, through) < 0) continue;

      const cands = await query<{ id: string; difficulty: any; answer_type: string; meta: any; answer: string }>(
        `select id, difficulty, answer_type, meta, answer from puzzles where edition = $1 and mode = $2 and status = 'live'`,
        [edition, mode],
      );
      const candidates: ScheduleCandidate[] = cands.map((c) => ({
        id: c.id, difficulty: c.difficulty, answerType: c.answer_type, people: people(c.meta, c.answer, mode),
      }));
      const histRows = await query<{ play_date: string; puzzle_id: string }>(
        `select play_date::text as play_date, puzzle_id from schedule
         where edition = $1 and mode = $2 and play_date >= $3::date`,
        [edition, mode, addDays(start, -731)],
      );
      const history = histRows.map((h) => ({ date: dateStr(h.play_date), puzzleId: h.puzzle_id }));
      const overrides = new Map(
        (
          await query<{ play_date: string; puzzle_id: string }>(
            `select play_date::text as play_date, puzzle_id from schedule_overrides
             where edition = $1 and mode = $2 and play_date between $3::date and $4::date`,
            [edition, mode, start, through],
          )
        ).map((o) => [dateStr(o.play_date), o.puzzle_id]),
      );

      const inserts: SlotRow[] = [];
      for (let date = start; daysBetween(date, through) >= 0; date = addDays(date, 1)) {
        const forced = overrides.get(date);
        const pick = forced ? { puzzleId: forced } : pickPuzzle({ date, edition, mode, candidates, history });
        if (!pick) {
          alerts.push(`${edition} ${mode}: no live puzzle available for ${date}`);
          break;
        }
        history.push({ date, puzzleId: pick.puzzleId });
        inserts.push({ play_date: date, edition, mode, puzzle_id: pick.puzzleId, puzzle_number: puzzleNumber(date, LAUNCH_DATE) });
      }
      if (inserts.length) {
        const res = await query(
          `insert into schedule (play_date, edition, mode, puzzle_id, puzzle_number)
           select r.play_date::date, r.edition::edition, r.mode::mode, r.puzzle_id, r.puzzle_number
           from jsonb_to_recordset($1::text::jsonb) as r(play_date text, edition text, mode text, puzzle_id text, puzzle_number int)
           on conflict do nothing returning 1`,
          [JSON.stringify(inserts)],
        );
        added += res.length;
      }
    }
  }
  for (const r of await runway()) {
    if (r.days_left < RUNWAY_ALERT_DAYS) alerts.push(`${r.edition} ${r.mode}: only ${r.days_left} days of unscheduled live puzzles left`);
  }
  if (alerts.length) console.warn("[schedule]", alerts.join("\n"));
  return { added, alerts };
}

/**
 * Drop future slots (after `after`, default today IST) that point at puzzles which are no longer live, plus
 * every later slot in the same pool, so the next fill re-picks them from the current bank. Slots on or before
 * `after` are left alone: players may already have played them. Overrides are re-applied by the fill.
 */
export async function rescheduleFuture(after = istDate()) {
  const dropped = await query(
    `with stale as (
       select s.edition, s.mode, min(s.play_date) as first
       from schedule s join puzzles p on p.id = s.puzzle_id
       where s.play_date > $1::date and p.status <> 'live'
       group by 1, 2
     )
     delete from schedule s using stale
     where s.edition = stale.edition and s.mode = stale.mode and s.play_date >= stale.first
     returning 1`,
    [after],
  );
  const res = await ensureSchedule();
  return { dropped: dropped.length, ...res };
}

export async function runway() {
  return query<{ edition: Edition; mode: Mode; live: number; scheduled: number; days_left: number }>(
    `select p.edition, p.mode, count(*)::int as live,
            count(s.puzzle_id)::int as scheduled,
            (count(*) - count(s.puzzle_id))::int as days_left
     from puzzles p
     left join (select distinct puzzle_id from schedule) s on s.puzzle_id = p.id
     where p.status = 'live'
     group by 1, 2 order by 1, 2`,
  );
}

/** The six slots for a date (scheduling on demand if the nightly job has not run). */
export async function slotsFor(date: string): Promise<SlotRow[]> {
  const read = () =>
    query<SlotRow>(
      `select play_date::text as play_date, edition, mode, puzzle_id, puzzle_number from schedule where play_date = $1::date`,
      [date],
    );
  let rows = await read();
  if (rows.length < 6 && daysBetween(date, addDays(istDate(), SCHEDULE_DAYS_AHEAD)) >= 0 && daysBetween(LAUNCH_DATE, date) >= 0) {
    await ensureSchedule();
    rows = await read();
  }
  return rows;
}

export async function slotFor(date: string, edition: Edition, mode: Mode): Promise<SlotRow | null> {
  return (await slotsFor(date)).find((s) => s.edition === edition && s.mode === mode) ?? null;
}
