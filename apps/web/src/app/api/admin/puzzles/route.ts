import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, v: unknown) => { params.push(v); where.push(sql.replace("?", `$${params.length}`)); };
  const q = sp.get("q")?.trim();
  if (q) add(`(answer ilike ? or id ilike $${params.length + 1} or array_to_string(hints, ' ') ilike $${params.length + 1})`, `%${q}%`);
  for (const [k, cast] of [["edition", "edition"], ["mode", "mode"], ["difficulty", "difficulty"], ["status", "puzzle_status"]] as const) {
    const v = sp.get(k);
    if (v) add(`${k} = ?::${cast}`, v);
  }
  const flag = sp.get("flag");
  if (flag === "flagged") where.push(`verify_flag is not null`);
  if (flag === "clean") where.push(`verify_flag is null`);
  const page = Math.max(0, Number(sp.get("page") ?? 0));
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const [{ total }] = await query<{ total: number }>(`select count(*)::int as total from puzzles ${whereSql}`, params);
  const rows = await query(
    `select id, edition, mode, answer_type, category, difficulty, answer, aliases, year, hints, wrong_options,
            reveal_fact, meta, source, verify_flag, status, updated_at,
            (select count(*)::int from reports r where r.puzzle_id = puzzles.id and not r.resolved) as open_reports,
            (select min(play_date)::text from schedule s where s.puzzle_id = puzzles.id and s.play_date >= current_date) as next_scheduled
     from puzzles ${whereSql} order by id limit 50 offset ${page * 50}`,
    params,
  );
  return json({ total, page, pageSize: 50, rows });
});
