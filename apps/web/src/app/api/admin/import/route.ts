import fs from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/admin";
import { body, handler, HttpError, json } from "@/lib/http";
import { importBank, type ImportStatus } from "@/lib/importBank";
import { ensureSchedule, rescheduleFuture } from "@/lib/schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function bankPath(): string {
  for (const p of [
    path.join(/*turbopackIgnore: true*/ process.cwd(), "../../content/Culturdle_Question_Bank.xlsx"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "content/Culturdle_Question_Bank.xlsx"),
  ]) if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
  throw new HttpError(500, "no_bank", "Question bank workbook not found in the deployment");
}

type ImportBody = { status?: ImportStatus; forceStatus?: boolean; retireMissing?: boolean };

/**
 * Re-import the bundled question bank (and refill the schedule). Admin only.
 * retireMissing retires puzzles that were cut from the workbook and re-picks any future slots that used them.
 */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await body<ImportBody>(req).catch(() => ({}) as ImportBody);
  if (b.status && !["draft", "reviewed", "live"].includes(b.status)) throw new HttpError(400, "bad_status");
  const res = await importBank(bankPath(), { status: b.status ?? "draft", forceStatus: b.forceStatus, retireMissing: b.retireMissing });
  const sched = b.retireMissing ? await rescheduleFuture() : { dropped: 0, ...(await ensureSchedule()) };
  return json({
    imported: res.imported, rejected: res.rejected.length, retired: res.retired, counts: res.counts,
    unscheduled: sched.dropped, scheduled: sched.added, alerts: sched.alerts,
  });
});
