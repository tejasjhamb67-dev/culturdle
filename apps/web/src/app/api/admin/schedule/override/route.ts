import { daysBetween, istDate } from "@culturdle/core";
import { requireAdmin } from "@/lib/admin";
import { tx } from "@/lib/db";
import { body, handler, HttpError, json } from "@/lib/http";
import { assertEdition, assertMode } from "@/lib/game";

export const dynamic = "force-dynamic";

/** Pin a puzzle to a date (birthdays, releases, festivals). Overrides win over the algorithm. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await body<{ date: string; edition: string; mode: string; puzzleId: string; note?: string }>(req);
  const edition = assertEdition(b.edition);
  const mode = assertMode(b.mode);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || daysBetween(istDate(), b.date) < 0) throw new HttpError(400, "past_date", "Only today or later");
  return json(
    await tx(async (q) => {
      const [p] = await q(`select id, edition, mode from puzzles where id = $1`, [b.puzzleId]);
      if (!p) throw new HttpError(404, "no_puzzle", "Unknown puzzle id");
      if (p.edition !== edition || p.mode !== mode) throw new HttpError(400, "wrong_pool", "Puzzle is from a different edition or mode");
      if (b.date === istDate()) {
        const [played] = await q(`select 1 from plays where play_date = $1::date and edition = $2 and mode = $3 limit 1`, [b.date, edition, mode]);
        if (played) throw new HttpError(409, "already_played", "Players have already started today's puzzle");
      }
      await q(
        `insert into schedule_overrides (play_date, edition, mode, puzzle_id, note) values ($1::date, $2, $3, $4, $5)
         on conflict (play_date, edition, mode) do update set puzzle_id = excluded.puzzle_id, note = excluded.note`,
        [b.date, edition, mode, b.puzzleId, b.note ?? null],
      );
      await q(
        `update schedule set puzzle_id = $4 where play_date = $1::date and edition = $2 and mode = $3`,
        [b.date, edition, mode, b.puzzleId],
      );
      return { ok: true };
    }),
  );
});
