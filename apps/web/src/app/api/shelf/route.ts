import { handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { shelfFor } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const GET = handler(async () => json(await shelfFor(await requirePlayer())));
