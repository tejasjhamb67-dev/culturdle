import { handler } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { removeFriend } from "@/lib/social";

export const dynamic = "force-dynamic";
export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await removeFriend(await requirePlayer(), (await ctx.params).id);
  return new Response(null, { status: 204 });
});
