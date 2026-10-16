/** Apply supabase/migrations/*.sql to DATABASE_URL (or the local PGlite DB). */
import { closeDb, ready } from "../src/lib/db";

ready()
  .then(async () => {
    console.log("Migrations applied.");
    await closeDb();
  })
  .catch(async (e) => {
    console.error(e);
    await closeDb();
    process.exit(1);
  });
