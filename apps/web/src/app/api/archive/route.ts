import { istDate } from "@culturdle/core";
import { query } from "@/lib/db";
import { LAUNCH_DATE } from "@/lib/config";
import { handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

/** Past days with this player's result per slot. Playing them needs Culturdle+. */
export const GET = handler(async () => {
  const p = await requirePlayer();
  const rows = await query<{ play_date: string; puzzle_number: number; edition: string; mode: string; solved: boolean | null; finished: boolean; points: number | null }>(
    `select s.play_date::text as play_date, s.puzzle_number, s.edition, s.mode, pl.solved,
            (pl.finished_at is not null) as finished, pl.points
     from schedule s
     left join plays pl on pl.player_id = $1 and pl.play_date = s.play_date and pl.edition = s.edition and pl.mode = s.mode
     where s.play_date < $2::date and s.play_date >= $3::date
     order by s.play_date desc, s.edition, s.mode`,
    [p.id, istDate(), LAUNCH_DATE],
  );
  const days = new Map<string, any>();
  for (const r of rows) {
    const d = days.get(r.play_date) ?? { date: r.play_date, puzzleNumber: r.puzzle_number, slots: [] };
    d.slots.push({ edition: r.edition, mode: r.mode, finished: r.finished, solved: r.solved, points: r.points });
    days.set(r.play_date, d);
  }
  return json({ isPlus: p.is_plus, days: [...days.values()] });
});
