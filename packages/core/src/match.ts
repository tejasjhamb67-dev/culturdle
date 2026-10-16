import { normalize } from "./normalize";

/** Optimal-string-alignment Damerau–Levenshtein distance. */
export function damerauLevenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => {
    const row = new Array<number>(m + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[n][m];
}

/** Allowed edit distance for a normalised string of this length (0 below 5 chars). */
export function fuzzyThreshold(len: number): number {
  if (len < 5) return 0;
  if (len <= 8) return 1;
  return 2;
}

export interface PoolEntry {
  /** Stable key, e.g. the puzzle id. */
  key: string;
  /** Display name shown in autocomplete. */
  name: string;
  aliases: string[];
}

export interface IndexedEntry extends PoolEntry {
  forms: string[];
}

export interface GuessPool {
  entries: IndexedEntry[];
  byForm: Map<string, IndexedEntry[]>;
}

export function buildPool(entries: PoolEntry[]): GuessPool {
  const byForm = new Map<string, IndexedEntry[]>();
  const indexed = entries.map((e) => {
    const forms = [...new Set([e.name, ...e.aliases].map(normalize).filter(Boolean))];
    const ie: IndexedEntry = { ...e, forms };
    for (const f of forms) {
      const list = byForm.get(f) ?? [];
      list.push(ie);
      byForm.set(f, list);
    }
    return ie;
  });
  return { entries: indexed, byForm };
}

export type GuessResolution =
  | { kind: "correct"; matched: string }
  | { kind: "wrong"; matched: string; key: string }
  | { kind: "unknown" }
  | { kind: "ambiguous"; candidates: string[] };

/**
 * Resolve a typed guess against the target and its pool.
 * A guess counts only when it is a pool item, the answer, or an alias (exactly, or by an
 * unambiguous fuzzy match). Random text never costs a guess.
 */
export function resolveGuess(
  text: string,
  target: { answer: string; aliases: string[] },
  pool: GuessPool,
): GuessResolution {
  const g = normalize(text);
  if (!g) return { kind: "unknown" };
  const targetForms = new Set([target.answer, ...target.aliases].map(normalize).filter(Boolean));
  if (targetForms.has(g)) return { kind: "correct", matched: target.answer };

  const exact = pool.byForm.get(g);
  if (exact && exact.length > 0) {
    return { kind: "wrong", matched: exact[0].name, key: exact[0].key };
  }

  const threshold = fuzzyThreshold(g.length);
  if (threshold === 0) return { kind: "unknown" };

  // Fuzzy candidates: distinct names within the threshold.
  const hits = new Map<string, { name: string; key: string | null; dist: number; target: boolean }>();
  for (const f of targetForms) {
    const dist = damerauLevenshtein(g, f);
    if (dist <= threshold) hits.set(`__target__`, { name: target.answer, key: null, dist, target: true });
  }
  for (const e of pool.entries) {
    for (const f of e.forms) {
      if (Math.abs(f.length - g.length) > threshold) continue;
      const dist = damerauLevenshtein(g, f);
      if (dist <= threshold) {
        if (targetForms.has(f)) {
          hits.set(`__target__`, { name: target.answer, key: null, dist, target: true });
        } else if (!hits.has(e.key)) {
          hits.set(e.key, { name: e.name, key: e.key, dist, target: false });
        }
        break;
      }
    }
  }
  if (hits.size === 0) return { kind: "unknown" };
  if (hits.size === 1) {
    const [h] = hits.values();
    return h.target
      ? { kind: "correct", matched: target.answer }
      : { kind: "wrong", matched: h.name, key: h.key! };
  }
  return { kind: "ambiguous", candidates: [...hits.values()].map((h) => h.name).slice(0, 6) };
}

/** Up to `limit` autocomplete suggestions after at least 2 characters. */
export function suggest(pool: GuessPool, query: string, limit = 6): string[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const starts: string[] = [];
  const wordStarts: string[] = [];
  const contains: string[] = [];
  const seen = new Set<string>();
  for (const e of pool.entries) {
    if (seen.has(e.name)) continue;
    let bucket: string[] | null = null;
    for (const f of e.forms) {
      if (f.startsWith(q)) { bucket = starts; break; }
      if (f.includes(" " + q)) bucket = wordStarts;
      else if (!bucket && f.includes(q)) bucket = contains;
    }
    if (bucket) {
      bucket.push(e.name);
      seen.add(e.name);
    }
  }
  const byLen = (a: string, b: string) => a.length - b.length || a.localeCompare(b);
  return [...starts.sort(byLen), ...wordStarts.sort(byLen), ...contains.sort(byLen)].slice(0, limit);
}
