import crypto from "node:crypto";
import { cookies } from "next/headers";
import { query } from "./db";
import { sessionSecret } from "./config";
import { HttpError } from "./http";

const COOKIE = "cd_pid";
const ONE_YEAR = 60 * 60 * 24 * 400;

export interface Player {
  id: string;
  handle: string | null;
  friend_code: string;
  home_edition: "Global" | "India";
  reminder_time: string | null;
  is_guest: boolean;
  is_plus: boolean;
  created_at: string;
}

function sign(id: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(id).digest("base64url").slice(0, 32);
}

export function playerToken(id: string): string {
  return `${id}.${sign(id)}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [id, sig] = token.split(".");
  if (!id || !sig || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const expected = sign(id);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function randomCode(len = 6): string {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function displayName(p: { handle: string | null; friend_code: string }): string {
  return p.handle ?? `Guest ${p.friend_code.slice(0, 4)}`;
}

async function createPlayer(homeEdition?: string): Promise<Player> {
  for (let i = 0; i < 5; i++) {
    const id = crypto.randomUUID();
    const rows = await query<Player>(
      `insert into players (id, friend_code, home_edition) values ($1, $2, $3::edition)
       on conflict do nothing returning *`,
      [id, randomCode(), homeEdition === "India" ? "India" : "Global"],
    );
    if (rows[0]) {
      await query(`insert into streaks (player_id) values ($1) on conflict do nothing`, [id]);
      return rows[0];
    }
  }
  throw new Error("could not allocate a player");
}

/** The current player, or null when there is no valid cookie. */
export async function currentPlayer(): Promise<Player | null> {
  const jar = await cookies();
  const id = verifyToken(jar.get(COOKIE)?.value);
  if (!id) return null;
  const rows = await query<Player>(`update players set last_seen_at = now() where id = $1 returning *`, [id]);
  return rows[0] ?? null;
}

/** The current player; creates a guest (and sets the cookie) when needed. Route handlers only. */
export async function requirePlayer(opts: { create?: boolean } = { create: true }): Promise<Player> {
  const existing = await currentPlayer();
  if (existing) return existing;
  if (!opts.create) throw new HttpError(401, "no_player", "Play a puzzle first");
  const p = await createPlayer();
  await setPlayerCookie(p.id);
  return p;
}

export async function setPlayerCookie(id: string) {
  const jar = await cookies();
  jar.set(COOKIE, playerToken(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
