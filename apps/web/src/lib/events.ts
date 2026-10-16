import { query } from "./db";

export const CLIENT_EVENTS = new Set(["app_open", "share", "league_view", "invite_sent", "subscribe"]);

export async function track(name: string, playerId: string | null, props: Record<string, unknown> = {}) {
  try {
    await query(`insert into events (name, player_id, props) values ($1, $2, $3::jsonb)`, [
      name, playerId, JSON.stringify(props),
    ]);
  } catch (e) {
    console.warn("track failed", name, e);
  }
}
