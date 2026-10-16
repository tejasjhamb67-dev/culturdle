import { handler, HttpError, json } from "@/lib/http";
import { ensureSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/** Vercel Cron calls this nightly with `Authorization: Bearer $CRON_SECRET`. */
export const GET = handler(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) throw new HttpError(401, "unauthorized");
  return json(await ensureSchedule());
});
