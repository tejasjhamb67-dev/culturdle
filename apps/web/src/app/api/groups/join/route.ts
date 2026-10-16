import { body, handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { joinGroup } from "@/lib/social";

export const dynamic = "force-dynamic";
export const POST = handler(async (req: Request) => {
  const { code } = await body<{ code: string }>(req);
  return json(await joinGroup(await requirePlayer(), code));
});
