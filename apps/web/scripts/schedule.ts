/** Nightly scheduler (design §C4): pnpm schedule [--through YYYY-MM-DD] */
import { closeDb } from "../src/lib/db";
import { ensureSchedule, runway } from "../src/lib/schedule";

async function main() {
  const i = process.argv.indexOf("--through");
  const res = await ensureSchedule(i >= 0 ? process.argv[i + 1] : undefined);
  console.log(`Scheduled ${res.added} new slots.`);
  if (res.alerts.length) console.log("Alerts:\n" + res.alerts.join("\n"));
  console.table(await runway());
  await closeDb();
}
main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
