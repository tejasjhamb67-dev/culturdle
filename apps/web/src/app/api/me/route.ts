import { streakFor } from "@/lib/game";
import { query } from "@/lib/db";
import { body, handler, HttpError, json } from "@/lib/http";
import { displayName, requirePlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

async function view() {
  const p = await requirePlayer();
  return {
    id: p.id,
    name: displayName(p),
    handle: p.handle,
    friendCode: p.friend_code,
    homeEdition: p.home_edition,
    reminderTime: p.reminder_time?.slice(0, 5) ?? null,
    isGuest: p.is_guest,
    isPlus: p.is_plus,
    createdAt: p.created_at,
    streak: await streakFor(p.id),
  };
}

export const GET = handler(async () => json(await view()));

export const PATCH = handler(async (req: Request) => {
  const p = await requirePlayer();
  const b = await body<{ handle?: string | null; homeEdition?: string; reminderTime?: string | null }>(req);
  if (b.handle !== undefined) {
    const h = b.handle === null ? null : String(b.handle).trim();
    if (h !== null && !/^[A-Za-z0-9_. -]{3,20}$/.test(h)) {
      throw new HttpError(400, "bad_handle", "Use 3–20 letters, numbers, spaces, dots or underscores");
    }
    try {
      await query(`update players set handle = $2, is_guest = ($2 is null) where id = $1`, [p.id, h]);
    } catch (e: any) {
      if (String(e?.code) === "23505" || /unique/i.test(String(e?.message))) throw new HttpError(409, "handle_taken", "That name is taken");
      throw e;
    }
  }
  if (b.homeEdition !== undefined) {
    if (b.homeEdition !== "Global" && b.homeEdition !== "India") throw new HttpError(400, "bad_edition");
    await query(`update players set home_edition = $2::edition where id = $1`, [p.id, b.homeEdition]);
  }
  if (b.reminderTime !== undefined) {
    if (b.reminderTime !== null && !/^\d{2}:\d{2}$/.test(b.reminderTime)) throw new HttpError(400, "bad_time");
    await query(`update players set reminder_time = $2::time where id = $1`, [p.id, b.reminderTime]);
  }
  return json(await view());
});
