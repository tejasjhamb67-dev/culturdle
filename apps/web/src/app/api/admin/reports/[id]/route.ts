import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { body, handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { resolved } = await body<{ resolved: boolean }>(req);
  await query(`update reports set resolved = $2 where id = $1`, [Number((await ctx.params).id), !!resolved]);
  return json({ ok: true });
});
