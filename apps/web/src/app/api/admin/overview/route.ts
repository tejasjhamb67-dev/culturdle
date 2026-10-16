import { istDate } from "@culturdle/core";
import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { handler, json } from "@/lib/http";
import { runway } from "@/lib/schedule";
import { RUNWAY_ALERT_DAYS } from "@/lib/config";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireAdmin();
  const today = istDate();
  const [counts, rw, [players], [dau], rejects, events] = await Promise.all([
    query(`select edition, mode, status, count(*)::int as n from puzzles group by 1,2,3 order by 1,2,3`),
    runway(),
    query<{ n: number }>(`select count(*)::int as n from players`),
    query<{ n: number }>(`select count(distinct player_id)::int as n from plays where play_date = $1::date`, [today]),
    query(`select sheet, row_id, errors from import_log order by id limit 500`),
    query(`select name, count(*)::int as n from events where created_at > now() - interval '7 days' group by 1 order by 2 desc`),
  ]);
  return json({
    today, counts, players: players.n, dailyActive: dau.n, events,
    runway: rw.map((r) => ({ ...r, alert: r.days_left < RUNWAY_ALERT_DAYS })),
    rejects,
  });
});
