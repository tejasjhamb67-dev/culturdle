import { addDays, istDate } from "@culturdle/core";
import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { handler, json } from "@/lib/http";
import { ensureSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from") ?? addDays(istDate(), -3);
  const to = sp.get("to") ?? addDays(from, 20);
  const rows = await query(
    `select s.play_date::text as play_date, s.edition, s.mode, s.puzzle_id, s.puzzle_number, p.answer, p.difficulty,
            p.status, p.verify_flag, (o.puzzle_id is not null) as overridden,
            (select count(*)::int from plays pl where pl.play_date = s.play_date and pl.edition = s.edition and pl.mode = s.mode) as plays,
            (select count(*) filter (where solved)::int from plays pl where pl.play_date = s.play_date and pl.edition = s.edition and pl.mode = s.mode and pl.finished_at is not null) as solved,
            (select count(*)::int from plays pl where pl.play_date = s.play_date and pl.edition = s.edition and pl.mode = s.mode and pl.finished_at is not null) as finished
     from schedule s join puzzles p on p.id = s.puzzle_id
     left join schedule_overrides o on o.play_date = s.play_date and o.edition = s.edition and o.mode = s.mode
     where s.play_date between $1::date and $2::date order by s.play_date, s.edition, s.mode`,
    [from, to],
  );
  return json({ from, to, today: istDate(), rows });
});

export const POST = handler(async () => {
  await requireAdmin();
  return json(await ensureSchedule());
});
