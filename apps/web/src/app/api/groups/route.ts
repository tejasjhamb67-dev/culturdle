import { body, handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { createGroup, myGroups } from "@/lib/social";

export const dynamic = "force-dynamic";
export const GET = handler(async () => json({ groups: await myGroups(await requirePlayer()) }));
export const POST = handler(async (req: Request) => {
  const { name } = await body<{ name: string }>(req);
  return json(await createGroup(await requirePlayer(), name), 201);
});
