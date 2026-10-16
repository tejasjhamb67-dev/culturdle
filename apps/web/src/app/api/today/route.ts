import { getDay } from "@/lib/game";
import { handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const player = await requirePlayer();
  return json(await getDay(player));
});
