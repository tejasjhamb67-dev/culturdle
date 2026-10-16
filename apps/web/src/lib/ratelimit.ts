import { HttpError } from "./http";

const buckets = new Map<string, number[]>();

/** Sliding-window limiter (per instance). 30 guesses per minute per player by default. */
export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) throw new HttpError(429, "rate_limited", "Slow down a little");
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
}
