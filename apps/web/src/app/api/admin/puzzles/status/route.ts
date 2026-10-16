import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { body, handler, HttpError, json } from "@/lib/http";
import { invalidatePools } from "@/lib/pools";

export const dynamic = "force-dynamic";

/** Bulk status change for a list of ids. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { ids, status } = await body<{ ids: string[]; status: string }>(req);
  if (!["draft", "reviewed", "live", "retired"].includes(status)) throw new HttpError(400, "bad_status");
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 1000) throw new HttpError(400, "bad_ids");
  const rows = await query(
    `update puzzles set status = $2::puzzle_status, updated_at = now()
     where id in (select jsonb_array_elements_text($1::jsonb)) returning id`,
    [JSON.stringify(ids), status],
  );
  invalidatePools();
  return json({ updated: rows.length });
});
