import { assertEdition, shareFor } from "@/lib/game";
import { handler, HttpError, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ date: string; edition: string }> }) => {
  const { date, edition } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "bad_date");
  const s = await shareFor(await requirePlayer(), date, assertEdition(edition));
  return json({ text: s.text, imageUrl: `/api/share/${date}/${edition}/image` });
});
