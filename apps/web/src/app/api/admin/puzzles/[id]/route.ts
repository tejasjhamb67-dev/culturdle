import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { body, handler, HttpError, json } from "@/lib/http";
import { invalidatePools } from "@/lib/pools";
import { validateRow } from "@culturdle/core";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const [row] = await query(`select * from puzzles where id = $1`, [id]);
  if (!row) throw new HttpError(404, "no_puzzle");
  const stats = await query(
    `select count(*)::int as plays, count(*) filter (where solved)::int as solved,
            array[ count(*) filter (where solved and guess_count = 1), count(*) filter (where solved and guess_count = 2),
                   count(*) filter (where solved and guess_count = 3), count(*) filter (where solved and guess_count = 4),
                   count(*) filter (where solved and guess_count = 5), count(*) filter (where solved and guess_count = 6) ]::int[] as distribution
     from plays where puzzle_id = $1 and finished_at is not null`,
    [id],
  );
  const reports = await query(`select id, message, resolved, created_at from reports where puzzle_id = $1 order by created_at desc`, [id]);
  const schedule = await query(`select play_date::text as play_date, puzzle_number from schedule where puzzle_id = $1 order by play_date`, [id]);
  return json({ puzzle: row, stats: stats[0], reports, schedule });
});

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const b = await body<{ answer?: string; hints?: string[]; wrongOptions?: string[]; revealFact?: string; aliases?: string[]; status?: string; difficulty?: string; verifyFlag?: string | null }>(req);
  const [cur] = await query<{ answer: string; hints: string[]; wrong_options: string[] }>(`select answer, hints, wrong_options from puzzles where id = $1`, [id]);
  if (!cur) throw new HttpError(404, "no_puzzle");
  const answer = b.answer ?? cur.answer;
  const hints = b.hints ?? cur.hints;
  const wrong = b.wrongOptions ?? cur.wrong_options;
  if (hints.length !== 6 || wrong.length !== 3) throw new HttpError(400, "shape", "Need exactly 6 hints and 3 wrong options");
  const errors = validateRow({ answer, hints, wrongOptions: wrong });
  if (errors.length) throw new HttpError(400, "invalid", errors.join("; "), { errors });
  if (b.status && !["draft", "reviewed", "live", "retired"].includes(b.status)) throw new HttpError(400, "bad_status");
  if (b.difficulty && !["Easy", "Medium", "Hard"].includes(b.difficulty)) throw new HttpError(400, "bad_difficulty");
  const [row] = await query(
    `update puzzles set
       answer = $2,
       hints = array(select jsonb_array_elements_text($3::jsonb)),
       wrong_options = array(select jsonb_array_elements_text($4::jsonb)),
       reveal_fact = coalesce($5, reveal_fact),
       aliases = case when $6::jsonb is null then aliases else array(select jsonb_array_elements_text($6::jsonb)) end,
       status = coalesce($7::puzzle_status, status),
       difficulty = coalesce($8::difficulty, difficulty),
       verify_flag = case when $9::boolean then $10 else verify_flag end,
       updated_at = now()
     where id = $1 returning *`,
    [id, answer, JSON.stringify(hints), JSON.stringify(wrong), b.revealFact ?? null,
     b.aliases ? JSON.stringify(b.aliases) : null, b.status ?? null, b.difficulty ?? null,
     b.verifyFlag !== undefined, b.verifyFlag ?? null],
  );
  invalidatePools();
  return json({ puzzle: row });
});
