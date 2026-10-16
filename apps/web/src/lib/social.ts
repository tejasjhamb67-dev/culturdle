import crypto from "node:crypto";
import { addDays, displayStreak, istDate, weekStart, type Edition } from "@culturdle/core";
import { query } from "./db";
import { HttpError } from "./http";
import { displayName, randomCode, type Player } from "./player";
import { track } from "./events";

export interface LeagueRow {
  rank: number;
  playerId: string;
  name: string;
  score: number;
  streak: number;
  me: boolean;
}

type Period = "day" | "week";

function range(period: Period, date = istDate()) {
  if (period === "day") return { from: date, to: date };
  const from = weekStart(date);
  return { from, to: addDays(from, 6) };
}

async function scored(sqlWhere: string, params: unknown[], from: string, to: string, edition: Edition | null, meId: string, limit = 100) {
  const editionClause = edition ? `and pl.edition = $${params.length + 3}` : "";
  const rows = await query<{ player_id: string; handle: string | null; friend_code: string; score: number; current: number | null; best: number | null; freezes: number | null; last_play_date: string | null; rank: number }>(
    `with members as (${sqlWhere}),
     totals as (
       select m.player_id, coalesce(sum(pl.points), 0)::int as score
       from members m
       left join plays pl on pl.player_id = m.player_id and not pl.is_archive
            and pl.play_date between $${params.length + 1}::date and $${params.length + 2}::date ${editionClause}
       group by m.player_id
     )
     select t.player_id, p.handle, p.friend_code, t.score, s.current, s.best, s.freezes, s.last_play_date::text as last_play_date,
            rank() over (order by t.score desc)::int as rank
     from totals t join players p on p.id = t.player_id left join streaks s on s.player_id = t.player_id
     order by t.score desc, p.handle nulls last, p.friend_code`,
    [...params, from, to, ...(edition ? [edition] : [])],
  );
  const today = istDate();
  const all: LeagueRow[] = rows.map((r) => ({
    rank: r.rank,
    playerId: r.player_id,
    name: displayName(r),
    score: r.score,
    streak: displayStreak({ current: r.current ?? 0, best: r.best ?? 0, freezes: r.freezes ?? 0, lastPlayDate: r.last_play_date }, today),
    me: r.player_id === meId,
  }));
  return { rows: all.slice(0, limit), me: all.find((r) => r.me) ?? null, total: all.length };
}

export async function friendsLeague(player: Player) {
  const { from, to } = range("week");
  const res = await scored(
    `select $1::uuid as player_id union select friend_id from friendships where player_id = $1`,
    [player.id], from, to, null, player.id,
  );
  return { ...res, from, to };
}

export async function globalLeague(player: Player, edition: Edition, period: Period) {
  const { from, to } = range(period);
  const res = await scored(
    `select distinct player_id from plays where play_date between $1::date and $2::date and edition = $3 and not is_archive and finished_at is not null
     union select $4::uuid`,
    [from, to, edition, player.id], from, to, edition, player.id,
  );
  return { ...res, from, to, edition, period };
}

export async function groupLeague(player: Player, groupId: string) {
  await assertMember(player, groupId);
  const { from, to } = range("week");
  const [group] = await query(`select id, name, invite_code from groups where id = $1`, [groupId]);
  const res = await scored(`select player_id from group_members where group_id = $1`, [groupId], from, to, null, player.id);
  return { ...res, from, to, group };
}

async function assertMember(player: Player, groupId: string) {
  if (!/^[0-9a-f-]{36}$/.test(groupId)) throw new HttpError(404, "no_group");
  const [m] = await query(`select 1 from group_members where group_id = $1 and player_id = $2`, [groupId, player.id]);
  if (!m) throw new HttpError(403, "not_member", "Join this group with its invite link");
}

export async function myGroups(player: Player) {
  return query<{ id: string; name: string; invite_code: string; members: number }>(
    `select g.id, g.name, g.invite_code, (select count(*)::int from group_members x where x.group_id = g.id) as members
     from groups g join group_members m on m.group_id = g.id where m.player_id = $1 order by g.created_at`,
    [player.id],
  );
}

export async function createGroup(player: Player, name: string) {
  const clean = (name ?? "").toString().trim().slice(0, 40);
  if (clean.length < 2) throw new HttpError(400, "bad_name", "Give the group a name");
  const id = crypto.randomUUID();
  const code = randomCode(8);
  await query(`insert into groups (id, name, invite_code, owner) values ($1, $2, $3, $4)`, [id, clean, code, player.id]);
  await query(`insert into group_members (group_id, player_id) values ($1, $2)`, [id, player.id]);
  return { id, name: clean, invite_code: code, members: 1 };
}

export async function joinGroup(player: Player, code: string) {
  const [g] = await query<{ id: string; name: string; invite_code: string }>(
    `select id, name, invite_code from groups where invite_code = $1`,
    [(code ?? "").toString().trim().toUpperCase()],
  );
  if (!g) throw new HttpError(404, "no_group", "That invite code does not exist");
  await query(`insert into group_members (group_id, player_id) values ($1, $2) on conflict do nothing`, [g.id, player.id]);
  void track("invite_joined", player.id, { kind: "group", group_id: g.id });
  return g;
}

export async function leaveGroup(player: Player, groupId: string) {
  await query(`delete from group_members where group_id = $1 and player_id = $2`, [groupId, player.id]);
}

export async function addFriend(player: Player, code: string) {
  const c = (code ?? "").toString().trim().toUpperCase();
  const [f] = await query<{ id: string; handle: string | null; friend_code: string }>(
    `select id, handle, friend_code from players where friend_code = $1 or lower(handle) = lower($2)`,
    [c, (code ?? "").toString().trim()],
  );
  if (!f) throw new HttpError(404, "no_player", "No player with that code");
  if (f.id === player.id) throw new HttpError(400, "self", "That is your own code");
  await query(
    `insert into friendships (player_id, friend_id) values ($1, $2), ($2, $1) on conflict do nothing`,
    [player.id, f.id],
  );
  void track("invite_joined", player.id, { kind: "friend" });
  return { id: f.id, name: displayName(f) };
}

export async function removeFriend(player: Player, friendId: string) {
  await query(`delete from friendships where (player_id = $1 and friend_id = $2) or (player_id = $2 and friend_id = $1)`, [player.id, friendId]);
}

export async function friendsList(player: Player) {
  const rows = await query<{ id: string; handle: string | null; friend_code: string }>(
    `select p.id, p.handle, p.friend_code from friendships f join players p on p.id = f.friend_id where f.player_id = $1 order by p.handle`,
    [player.id],
  );
  return rows.map((r) => ({ id: r.id, name: displayName(r) }));
}
