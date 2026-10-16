import { assertEdition } from "@/lib/game";
import { handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { globalLeague } from "@/lib/social";

export const dynamic = "force-dynamic";
export const GET = handler(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const period = sp.get("period") === "week" ? "week" : "day";
  return json(await globalLeague(await requirePlayer(), assertEdition(sp.get("edition") ?? "Global"), period));
});
