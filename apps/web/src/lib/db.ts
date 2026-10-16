import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./migrations.generated";

/**
 * One tiny query interface over two drivers:
 *  - DATABASE_URL set → postgres.js (Supabase or any Postgres; use the pooled connection string on Vercel)
 *  - otherwise        → embedded PGlite persisted in .data/pglite (local development, zero setup)
 * Queries use $1-style params. Arrays and objects are passed as JSON and cast in SQL.
 */
export type Row = Record<string, any>;
export interface Q {
  <T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
}
interface Driver {
  query: Q;
  tx<T>(fn: (q: Q) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

const g = globalThis as unknown as { __culturdleDb?: Promise<Driver> };

function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

async function makeDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, {
      max: Number(process.env.DB_POOL_MAX ?? 5),
      prepare: false, // safe with Supabase's transaction pooler
      onnotice: () => {},
    });
    const wrap = (s: any): Q => (async (text: string, params: unknown[] = []) => s.unsafe(text, params as any[])) as Q;
    return {
      query: wrap(sql),
      tx: (fn) => sql.begin((s: any) => fn(wrap(s))) as any,
      close: () => sql.end(),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = process.env.PGLITE_DIR ?? path.join(repoRoot(), ".data", "pglite");
  if (dataDir !== "memory://") fs.mkdirSync(dataDir, { recursive: true });
  const db = dataDir === "memory://" ? new PGlite() : new PGlite(dataDir);
  await db.waitReady;
  const wrap = (s: any): Q => (async (text: string, params: unknown[] = []) => (await s.query(text, params)).rows) as Q;
  return {
    query: wrap(db),
    tx: (fn) => db.transaction((t) => fn(wrap(t))),
    close: () => db.close(),
  };
}

async function driver(): Promise<Driver> {
  if (!g.__culturdleDb) {
    g.__culturdleDb = makeDriver().then(async (d) => {
      await migrate(d);
      return d;
    });
    g.__culturdleDb.catch(() => (g.__culturdleDb = undefined));
  }
  return g.__culturdleDb;
}

export const query: Q = (async (text: string, params?: unknown[]) => (await driver()).query(text, params)) as Q;
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  return (await driver()).tx(fn);
}
export async function closeDb() {
  if (g.__culturdleDb) {
    const d = await g.__culturdleDb;
    g.__culturdleDb = undefined;
    await d.close();
  }
}

async function migrate(d: Driver) {
  await d.query(`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await d.query<{ name: string }>(`select name from schema_migrations`)).map((r) => r.name));
  for (const m of MIGRATIONS) {
    if (done.has(m.name)) continue;
    await d.tx(async (q) => {
      for (const stmt of splitSql(m.sql)) await q(stmt);
      await q(`insert into schema_migrations (name) values ($1) on conflict do nothing`, [m.name]);
    });
  }
}

/** Split a migration on top-level semicolons (keeps $$ blocks intact). */
function splitSql(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inDollar = false;
  const lines = text.split("\n").filter((l) => !l.trim().startsWith("--"));
  const src = lines.join("\n");
  for (let i = 0; i < src.length; i++) {
    if (src.startsWith("$$", i)) {
      inDollar = !inDollar;
      cur += "$$";
      i++;
      continue;
    }
    const ch = src[i];
    if (ch === ";" && !inDollar) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Ensure the DB is connected and migrated (scripts call this). */
export async function ready() {
  await driver();
}
