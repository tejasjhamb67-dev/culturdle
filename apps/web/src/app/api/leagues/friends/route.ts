import { handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { friendsLeague } from "@/lib/social";

export const dynamic = "force-dynamic";
export const GET = handler(async () => json(await friendsLeague(await requirePlayer())));
