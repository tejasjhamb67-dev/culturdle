import { istDate } from "@culturdle/core";
import { assertEdition, assertMode, getPuzzle } from "@/lib/game";
import { handler, HttpError, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request, ctx: { params: Promise<{ edition: string; mode: string }> }) => {
  const { edition, mode } = await ctx.params;
  const date = new URL(req.url).searchParams.get("date") ?? istDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "bad_date");
  const player = await requirePlayer();
  return json(await getPuzzle(player, assertEdition(edition), assertMode(mode), date));
});
