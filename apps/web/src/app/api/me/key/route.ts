import { handler, json } from "@/lib/http";
import { playerToken, requirePlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

/** The player key moves a profile to another device (until full sign-in ships). */
export const GET = handler(async () => {
  const p = await requirePlayer();
  return json({ key: playerToken(p.id) }, { headers: { "Cache-Control": "no-store" } });
});
