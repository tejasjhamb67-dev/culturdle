import { handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { groupLeague } from "@/lib/social";

export const dynamic = "force-dynamic";
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) =>
  json(await groupLeague(await requirePlayer(), (await ctx.params).id)),
);
