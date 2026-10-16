import fs from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/admin";
import { body, handler, HttpError, json } from "@/lib/http";
import { importBank, type ImportStatus } from "@/lib/importBank";
import { ensureSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function bankPath(): string {
  for (const p of [
    path.join(/*turbopackIgnore: true*/ process.cwd(), "../../content/Culturdle_Question_Bank.xlsx"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "content/Culturdle_Question_Bank.xlsx"),
  ]) if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
  throw new HttpError(500, "no_bank", "Question bank workbook not found in the deployment");
}

/** Re-import the bundled question bank (and refill the schedule). Admin only. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await body<{ status?: ImportStatus; forceStatus?: boolean }>(req).catch(() => ({}) as { status?: ImportStatus; forceStatus?: boolean });
  if (b.status && !["draft", "reviewed", "live"].includes(b.status)) throw new HttpError(400, "bad_status");
  const res = await importBank(bankPath(), { status: b.status ?? "draft", forceStatus: b.forceStatus });
  const sched = await ensureSchedule();
  return json({ imported: res.imported, rejected: res.rejected.length, counts: res.counts, scheduled: sched.added, alerts: sched.alerts });
});
