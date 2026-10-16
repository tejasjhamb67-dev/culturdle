import { query } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Liveness + database check. Reports the error code and message only (never connection details). */
export async function GET() {
  try {
    const [r] = await query<{ puzzles: number; scheduled: number }>(
      `select (select count(*)::int from puzzles) as puzzles, (select count(*)::int from schedule) as scheduled`,
    );
    return json({ ok: true, db: "ok", ...r });
  } catch (e: any) {
    const msg = String(e?.message ?? e).replace(/postgres(ql)?:\/\/\S+/g, "[url]").slice(0, 200);
    return json({ ok: false, db: "error", code: e?.code ?? null, message: msg }, 503);
  }
}
