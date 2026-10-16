import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Per-puzzle solve rates (for difficulty recalibration, design §A4). */
export const GET = handler(async () => {
  await requireAdmin();
  const rows = await query(
    `select p.id, p.answer, p.edition, p.mode, p.difficulty,
            count(*)::int as plays, count(*) filter (where pl.solved)::int as solved,
            round(100.0 * count(*) filter (where pl.solved) / nullif(count(*), 0))::int as solve_rate,
            percentile_cont(0.5) within group (order by pl.guess_count) filter (where pl.solved) as median_guess,
            case when count(*) < 30 then null
                 when 100.0 * count(*) filter (where pl.solved) / count(*) > 90 then 'Easy'
                 when 100.0 * count(*) filter (where pl.solved) / count(*) >= 75 then 'Medium'
                 else 'Hard' end as suggested_difficulty
     from plays pl join puzzles p on p.id = pl.puzzle_id
     where pl.finished_at is not null and not pl.is_archive
     group by p.id order by plays desc limit 500`,
  );
  return json({ rows });
});
