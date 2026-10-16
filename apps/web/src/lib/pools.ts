import { answerGroup, buildPool, suggest, type Edition, type GuessPool, type Mode } from "@culturdle/core";
import { query } from "./db";

/**
 * Autocomplete / guess pools, one per edition + mode + answer group, built from every
 * non-retired answer (drafts included) so the list never hints at what is live today.
 */
const TTL_MS = 10 * 60 * 1000;
const g = globalThis as unknown as { __culturdlePools?: { at: number; pools: Promise<Map<string, GuessPool>> } };

export const poolKey = (edition: Edition, mode: Mode, group: string) => `${edition}|${mode}|${group}`;

async function load(): Promise<Map<string, GuessPool>> {
  const rows = await query<{ id: string; edition: Edition; mode: Mode; answer_type: string; answer: string; aliases: string[]; wrong_options: string[] }>(
    `select id, edition, mode, answer_type, answer, aliases, wrong_options from puzzles where status <> 'retired'`,
  );
  const raw = new Map<string, { key: string; name: string; aliases: string[] }[]>();
  const names = new Map<string, Set<string>>();
  for (const r of rows) {
    const k = poolKey(r.edition, r.mode, answerGroup(r.mode, r.answer_type));
    if (!raw.has(k)) { raw.set(k, []); names.set(k, new Set()); }
    raw.get(k)!.push({ key: r.id, name: r.answer, aliases: r.aliases ?? [] });
    names.get(k)!.add(r.answer.toLowerCase());
  }
  // Decoys from guess-6 options are typeable too.
  for (const r of rows) {
    const k = poolKey(r.edition, r.mode, answerGroup(r.mode, r.answer_type));
    for (const o of r.wrong_options ?? []) {
      if (!names.get(k)!.has(o.toLowerCase())) {
        names.get(k)!.add(o.toLowerCase());
        raw.get(k)!.push({ key: `opt:${o}`, name: o, aliases: [] });
      }
    }
  }
  const out = new Map<string, GuessPool>();
  for (const [k, entries] of raw) out.set(k, buildPool(entries));
  return out;
}

export async function pools(): Promise<Map<string, GuessPool>> {
  const now = Date.now();
  if (!g.__culturdlePools || now - g.__culturdlePools.at > TTL_MS) {
    const p = load();
    g.__culturdlePools = { at: now, pools: p };
    p.catch(() => (g.__culturdlePools = undefined));
  }
  return g.__culturdlePools.pools;
}

export function invalidatePools() {
  g.__culturdlePools = undefined;
}

export async function poolFor(edition: Edition, mode: Mode, answerType: string): Promise<GuessPool> {
  return (await pools()).get(poolKey(edition, mode, answerGroup(mode, answerType))) ?? buildPool([]);
}

export async function suggestNames(edition: Edition, mode: Mode, answerType: string, q: string): Promise<string[]> {
  return suggest(await poolFor(edition, mode, answerType), q, 6);
}
