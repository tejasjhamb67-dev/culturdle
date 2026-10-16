/**
 * Import Culturdle_Question_Bank.xlsx into `puzzles` (design §C3).
 *   pnpm import:bank path/to/Culturdle_Question_Bank.xlsx [--status draft|reviewed|live] [--force-status] [--retire-missing]
 *   --retire-missing retires puzzles cut from the workbook and re-picks future schedule slots that used them.
 */
import fs from "node:fs";
import path from "node:path";
import { closeDb, ready } from "../src/lib/db";
import { importBank, type ImportStatus } from "../src/lib/importBank";
import { rescheduleFuture } from "../src/lib/schedule";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const file = process.argv.slice(2).find((a) => !a.startsWith("--") && a !== arg("--status"));
  if (!file) throw new Error("usage: import-bank <xlsx> [--status draft|reviewed|live] [--force-status] [--retire-missing]");
  const status = (arg("--status") ?? "draft") as ImportStatus;
  if (!["draft", "reviewed", "live"].includes(status)) throw new Error(`bad --status ${status}`);
  await ready();
  const retireMissing = process.argv.includes("--retire-missing");
  const { imported, rejected, retired, counts } = await importBank(path.resolve(file), {
    status, forceStatus: process.argv.includes("--force-status"), retireMissing,
  });
  const reportDir = path.resolve(process.cwd(), "../../.data");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "import-report.csv");
  fs.writeFileSync(
    reportPath,
    "sheet,id,errors\n" + rejected.map((r) => `${r.sheet},${r.id},"${r.errors.join("; ").replace(/"/g, '""')}"`).join("\n"),
  );
  console.log(`Imported ${imported} rows; rejected ${rejected.length} (see ${reportPath}).`);
  console.table(counts);
  if (retireMissing) {
    const r = await rescheduleFuture();
    console.log(`Retired ${retired} puzzles no longer in the bank; re-picked ${r.dropped} future slots (${r.added} scheduled).`);
  }
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
