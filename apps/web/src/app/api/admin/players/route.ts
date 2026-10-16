import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { body, handler, HttpError, json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Grant or remove Culturdle+ by friend code (until billing is wired up). */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { code, plus } = await body<{ code: string; plus: boolean }>(req);
  const rows = await query(`update players set is_plus = $2 where friend_code = $1 returning id, handle, friend_code, is_plus`, [String(code ?? "").toUpperCase(), !!plus]);
  if (!rows[0]) throw new HttpError(404, "no_player");
  return json(rows[0]);
});
