import { daysBetween, istDate } from "@culturdle/core";
import { requireAdmin } from "@/lib/admin";
import { tx } from "@/lib/db";
import { body, handler, HttpError, json } from "@/lib/http";
import { assertEdition, assertMode } from "@/lib/game";

export const dynamic = "force-dynamic";

/** Swap two future slots of the same edition and mode (drag-to-swap in the admin calendar). */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await body<{ a: string; b: string; edition: string; mode: string }>(req);
  const edition = assertEdition(b.edition);
  const mode = assertMode(b.mode);
  const today = istDate();
  for (const d of [b.a, b.b]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || daysBetween(today, d) <= 0) throw new HttpError(400, "future_only", "Only future days can be swapped");
  }
  return json(
    await tx(async (q) => {
      const rows = await q<{ play_date: string; puzzle_id: string }>(
        `select play_date::text as play_date, puzzle_id from schedule where edition = $1 and mode = $2 and play_date in ($3::date, $4::date) for update`,
        [edition, mode, b.a, b.b],
      );
      if (rows.length !== 2) throw new HttpError(404, "missing_slot");
      const [x, y] = rows;
      await q(`update schedule set puzzle_id = $4 where play_date = $1::date and edition = $2 and mode = $3`, [x.play_date, edition, mode, y.puzzle_id]);
      await q(`update schedule set puzzle_id = $4 where play_date = $1::date and edition = $2 and mode = $3`, [y.play_date, edition, mode, x.puzzle_id]);
      for (const [d, pid] of [[x.play_date, y.puzzle_id], [y.play_date, x.puzzle_id]]) {
        await q(
          `insert into schedule_overrides (play_date, edition, mode, puzzle_id, note) values ($1::date, $2, $3, $4, 'swap')
           on conflict (play_date, edition, mode) do update set puzzle_id = excluded.puzzle_id`,
          [d, edition, mode, pid],
        );
      }
      return { ok: true };
    }),
  );
});
