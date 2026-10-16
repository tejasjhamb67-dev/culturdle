"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Edition, Mode } from "@culturdle/core";
import { api, store } from "@/lib/client/api";
import type { Me } from "@/lib/client/types";
import { cx, MODE_META } from "@/lib/client/ui";
import { Header } from "@/components/Header";
import { Sheet } from "@/components/Sheet";

interface PoolStats { edition: Edition; mode: Mode; played: number; solved: number; solveRate: number; distribution: number[]; failed: number; points: number; winStreak: number; bestWinStreak: number; viaOptions: number }
interface Stats { totals: { played: number; solved: number; points: number; daysPlayed: number }; perPool: PoolStats[]; perfectDays: Record<Edition, number>; byDecade: { decade: string; played: number; solved: number }[] | null }

function Distribution({ d, failed, color }: { d: number[]; failed: number; color: string }) {
  const max = Math.max(1, ...d, failed);
  return (
    <div className="flex flex-col gap-1" aria-label="Guess distribution">
      {[...d, failed].map((n, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-3 text-muted">{i === 6 ? "✕" : i + 1}</span>
          <div className="h-4 flex-1 rounded bg-surface-2">
            <div className={cx("flex h-4 items-center justify-end rounded font-semibold text-white", n > 0 && "px-1")} style={{ width: `${n ? Math.max(12, (n / max) * 100) : 0}%`, background: i === 6 ? "var(--miss)" : i === 5 ? "var(--options)" : color }}>
              {n || ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [edition, setEdition] = useState<Edition>("Global");
  const [theme, setTheme] = useState("dark");
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [keyOpen, setKeyOpen] = useState(false);

  useEffect(() => {
    api<Me>("/api/me").then((m) => { setMe(m); setHandle(m.handle ?? ""); setEdition(m.homeEdition); });
    api<Stats>("/api/stats").then(setStats);
    setTheme(store.get("cd_theme") ?? "dark");
  }, []);

  const patch = async (json: Record<string, unknown>, ok = "Saved") => {
    setMsg(null);
    try {
      const m = await api<Me>("/api/me", { method: "PATCH", json });
      setMe(m);
      setMsg(ok);
      setTimeout(() => setMsg(null), 1600);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const applyTheme = (t: string) => {
    setTheme(t);
    store.set("cd_theme", t);
    const resolved = t === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
    document.documentElement.dataset.theme = resolved;
  };

  const pools = stats?.perPool.filter((p) => p.edition === edition) ?? [];

  return (
    <>
      <Header streak={me?.streak.current} />
      <section className="stub mb-5 flex items-center gap-4 px-5 py-4">
        <div className="font-display flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-movie via-music to-icon text-3xl text-white">
          {(me?.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-display text-3xl leading-none">{me?.name ?? "…"}</p>
          <p className="text-sm text-muted">Friend code <span className="font-semibold tracking-widest text-text">{me?.friendCode}</span>{me?.isPlus && <span className="ml-2 rounded-full bg-icon px-2 py-0.5 text-xs font-bold text-black">PLUS</span>}</p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-4 gap-2 text-center">
        {[
          ["Streak", me?.streak.current ?? 0],
          ["Best", me?.streak.best ?? 0],
          ["Freezes", `${me?.streak.freezes ?? 0}`],
          ["Points", stats?.totals.points ?? 0],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-line bg-surface py-3">
            <p className="font-display text-3xl leading-none">{v}</p>
            <p className="text-xs uppercase tracking-wider text-muted">{l}</p>
          </div>
        ))}
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-3xl">Stats</h2>
          <div className="flex gap-1 rounded-full border border-line p-1">
            {(["Global", "India"] as Edition[]).map((e) => (
              <button key={e} onClick={() => setEdition(e)} className={cx("rounded-full px-3 py-1 text-sm font-semibold", edition === e ? "bg-surface-2" : "text-muted")}>{e}</button>
            ))}
          </div>
        </div>
        <p className="mb-3 text-sm text-muted">Perfect Days in {edition}: <span className="font-semibold text-text">{stats?.perfectDays[edition] ?? 0}</span></p>
        <div className="flex flex-col gap-3">
          {pools.map((p) => {
            const m = MODE_META[p.mode];
            return (
              <div key={p.mode} className="rounded-2xl border border-line bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-2xl" style={{ color: m.color }}>{m.emoji} {m.label}</span>
                  <span className="text-sm text-muted">{p.played} played · {p.solveRate}% solved · 🏅 {p.winStreak} (best {p.bestWinStreak})</span>
                </div>
                <Distribution d={p.distribution} failed={p.failed} color={m.color} />
              </div>
            );
          })}
        </div>
        {stats?.byDecade ? (
          <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
            <p className="font-display mb-2 text-2xl">By decade</p>
            <ul className="grid grid-cols-3 gap-2 text-sm">
              {stats.byDecade.map((d) => <li key={d.decade} className="rounded-xl bg-surface-2 px-3 py-2"><b>{d.decade}</b><br /><span className="text-muted">{d.solved}/{d.played} solved</span></li>)}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Detailed stats by decade come with <a href="#plus" className="text-icon">Culturdle+</a>.</p>
        )}
      </section>

      <section className="mb-6 flex flex-col gap-3">
        <h2 className="font-display text-3xl">Settings</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Display name (shown in leagues)</span>
          <div className="flex gap-2">
            <input value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={20} placeholder="Pick a name" className="tap flex-1 rounded-2xl border border-line bg-surface px-4 text-[16px] outline-none" />
            <button onClick={() => patch({ handle: handle.trim() || null })} className="tap rounded-2xl bg-icon px-5 font-semibold text-black">Save</button>
          </div>
        </label>
        {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
        <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
          <span>Home edition</span>
          <select value={me?.homeEdition ?? "Global"} onChange={(e) => patch({ homeEdition: e.target.value })} className="tap rounded-xl bg-surface-2 px-3">
            <option>Global</option><option>India</option>
          </select>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
          <span>Daily reminder <span className="block text-xs text-muted">One nudge a day, at most</span></span>
          <input type="time" value={me?.reminderTime ?? ""} onChange={(e) => patch({ reminderTime: e.target.value || null }, "Reminder saved")} className="tap rounded-xl bg-surface-2 px-3" />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
          <span>Theme</span>
          <div className="flex gap-1">
            {["dark", "light", "system"].map((t) => (
              <button key={t} onClick={() => applyTheme(t)} className={cx("tap rounded-xl px-3 text-sm capitalize", theme === t ? "bg-surface-2 font-semibold" : "text-muted")}>{t}</button>
            ))}
          </div>
        </div>
        <button onClick={() => setKeyOpen(true)} className="tap rounded-2xl border border-line bg-surface px-4 text-left">
          Move to another device <span className="block text-xs text-muted">Copy your player key, or paste one from another phone</span>
        </button>
      </section>

      <section id="plus" className="mb-6 overflow-hidden rounded-3xl border border-icon/40 bg-gradient-to-br from-icon/15 via-music/10 to-movie/15 p-5">
        <p className="font-display text-4xl">Culturdle<span className="text-icon">+</span></p>
        <ul className="mt-2 space-y-1 text-[15px]">
          <li>📅 Full archive of past puzzles</li>
          <li>🧊 Bank up to 5 streak freezes</li>
          <li>📊 Detailed stats by decade and mode, and the full Shelf</li>
          <li>🚫 No ads</li>
        </ul>
        {me?.isPlus ? (
          <p className="mt-3 font-semibold text-icon">You have Culturdle+. Thank you! <Link href="/archive" className="underline">Open the archive →</Link></p>
        ) : (
          <p className="mt-3 text-sm text-muted">The six daily puzzles are always free. Culturdle+ is coming soon.</p>
        )}
      </section>
      <KeySheet open={keyOpen} onClose={() => setKeyOpen(false)} />
    </>
  );
}

function KeySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [key, setKey] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) api<{ key: string }>("/api/me/key").then((r) => setKey(r.key)); }, [open]);
  const restore = async () => {
    setErr(null);
    try {
      await api("/api/me/restore", { method: "POST", json: { key: paste } });
      window.location.href = "/";
    } catch (e: any) {
      setErr(e.message);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Your player key">
      <p className="text-sm text-muted">Keep this private — anyone with it can play as you.</p>
      <code className="mt-2 block break-all rounded-2xl border border-line bg-bg p-3 text-xs">{key ?? "…"}</code>
      <button onClick={() => key && navigator.clipboard.writeText(key)} className="tap mt-2 w-full rounded-2xl border border-line font-semibold">Copy key</button>
      <div className="my-4 border-t border-line" />
      <p className="mb-2 text-sm">Paste a key from another device to continue that profile here:</p>
      <input value={paste} onChange={(e) => setPaste(e.target.value)} className="tap w-full rounded-2xl border border-line bg-bg px-3 text-[16px]" />
      {err && <p className="mt-1 text-sm text-movie">{err}</p>}
      <button onClick={restore} disabled={!paste.trim()} className="tap mt-2 w-full rounded-2xl bg-icon font-semibold text-black disabled:opacity-40">Use this key</button>
    </Sheet>
  );
}
