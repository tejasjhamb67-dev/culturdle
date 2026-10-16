import { body, handler, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { addFriend, friendsList } from "@/lib/social";

export const dynamic = "force-dynamic";
export const GET = handler(async () => json({ friends: await friendsList(await requirePlayer()) }));
export const POST = handler(async (req: Request) => {
  const { code } = await body<{ code: string }>(req);
  return json(await addFriend(await requirePlayer(), code), 201);
});
