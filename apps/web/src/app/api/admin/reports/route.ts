import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const open = new URL(req.url).searchParams.get("all") !== "1";
  const rows = await query(
    `select r.id, r.puzzle_id, r.message, r.resolved, r.created_at, p.answer, p.edition, p.mode
     from reports r left join puzzles p on p.id = r.puzzle_id
     ${open ? "where not r.resolved" : ""} order by r.created_at desc limit 200`,
  );
  return json({ rows });
});
