export const LAUNCH_DATE = process.env.LAUNCH_DATE ?? "2026-10-16";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://culturdle.app").replace(/\/$/, "");
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");
export const SCHEDULE_DAYS_AHEAD = 60;
export const RUNWAY_ALERT_DAYS = 90;

export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return "culturdle-dev-secret";
}
