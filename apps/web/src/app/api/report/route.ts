import { istDate } from "@culturdle/core";
import { query } from "@/lib/db";
import { track } from "@/lib/events";
import { assertEdition, assertMode } from "@/lib/game";
import { body, handler, HttpError } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { rateLimit } from "@/lib/ratelimit";
import { slotFor } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export const POST = handler(async (req: Request) => {
  const b = await body<{ edition: string; mode: string; date?: string; message: string }>(req);
  const player = await requirePlayer();
  rateLimit(`report:${player.id}`, 5);
  const message = String(b.message ?? "").trim().slice(0, 1000);
  if (message.length < 3) throw new HttpError(400, "empty", "Tell us what is wrong");
  const date = b.date && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : istDate();
  const slot = await slotFor(date, assertEdition(b.edition), assertMode(b.mode));
  if (!slot) throw new HttpError(404, "no_puzzle");
  await query(`insert into reports (puzzle_id, player_id, message) values ($1, $2, $3)`, [slot.puzzle_id, player.id, message]);
  void track("report_submitted", player.id, { puzzle_id: slot.puzzle_id });
  return new Response(null, { status: 204 });
});
