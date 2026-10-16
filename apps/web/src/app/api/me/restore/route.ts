import { query } from "@/lib/db";
import { body, handler, HttpError, json } from "@/lib/http";
import { setPlayerCookie, verifyToken } from "@/lib/player";

export const dynamic = "force-dynamic";

export const POST = handler(async (req: Request) => {
  const { key } = await body<{ key: string }>(req);
  const id = verifyToken(String(key ?? "").trim());
  if (!id) throw new HttpError(400, "bad_key", "That key is not valid");
  const [p] = await query(`select id from players where id = $1`, [id]);
  if (!p) throw new HttpError(404, "no_player", "No profile for that key");
  await setPlayerCookie(id);
  return json({ ok: true });
});
