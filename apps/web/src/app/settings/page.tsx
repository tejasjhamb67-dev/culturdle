"use client";

import { useEffect, useState } from "react";
import type { Edition } from "@culturdle/core";
import { api, store } from "@/lib/client/api";
import type { Me } from "@/lib/client/types";
import { applyHighContrast, applyReducedMotion, applyTheme, type Theme } from "@/lib/client/prefs";
import { Page } from "@/components/Page";
import { Segmented } from "@/components/Segmented";
import { Button } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { Avatar } from "@/components/Avatar";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border py-3">
      <div>
        <p className="text-[17px] font-semibold leading-6">{label}</p>
        {hint && <p className="t-meta text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-8 w-[52px] rounded-full transition-colors ${on ? "bg-correct" : "bg-border"}`}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[24px]" : "left-1"}`} />
    </button>
  );
}

export default function Settings() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("system");
  const [hc, setHc] = useState(false);
  const [rm, setRm] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);

  useEffect(() => {
    api<Me>("/api/me").then((m) => { setMe(m); setName(m.handle ?? ""); });
    setTheme((store.get("cd_theme") as Theme) ?? "system");
    setHc(store.get("cd_hc") === "1");
    setRm(store.get("cd_motion") === "reduced");
  }, []);

  const patch = async (json: Record<string, unknown>, ok = "Saved") => {
    setMsg(null);
    try {
      setMe(await api<Me>("/api/me", { method: "PATCH", json }));
      setMsg(ok);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <Page title="Settings">
      <section className="flex items-center gap-3 rounded-[10px] bg-surface p-4">
        <Avatar name={me?.name ?? "?"} me size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold">{me?.name ?? "…"}</p>
          <p className="t-meta text-muted">Friend code <b className="tracking-[0.15em] text-text">{me?.friendCode}</b>{me?.isPlus && " · Culturdle+"}</p>
        </div>
      </section>

      <form className="mt-5 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void patch({ handle: name.trim() || null }); }}>
        <label htmlFor="name" className="t-label text-muted">Display name</label>
        <div className="flex gap-2">
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Shown on leaderboards" className="h-12 min-w-0 flex-1 rounded-[8px] border-2 border-border bg-bg px-4 text-[16px] outline-none focus:border-border-strong" />
          <Button size="md" type="submit" className="w-[84px]">Save</Button>
        </div>
        {msg && <p role="status" className="t-meta text-muted">{msg}</p>}
      </form>

      <section className="mt-4">
        <Row label="Home edition" hint="Shown first when you open Culturdle">
          <Segmented className="w-44" label="Home edition" value={me?.homeEdition ?? "Global"} onChange={(e: Edition) => patch({ homeEdition: e })} options={[{ value: "Global", label: "Global" }, { value: "India", label: "India" }]} />
        </Row>
        <Row label="Theme">
          <Segmented className="w-56" label="Theme" value={theme} onChange={(t) => { setTheme(t); applyTheme(t); }} options={[{ value: "system", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        </Row>
        <Row label="High contrast" hint="Orange and blue instead of green and yellow">
          <Switch label="High contrast" on={hc} onChange={(v) => { setHc(v); applyHighContrast(v); }} />
        </Row>
        <Row label="Reduce motion" hint="Fades instead of flips and shakes">
          <Switch label="Reduce motion" on={rm} onChange={(v) => { setRm(v); applyReducedMotion(v); }} />
        </Row>
        <Row label="Daily reminder" hint="One nudge a day, at most">
          <input type="time" aria-label="Reminder time" value={me?.reminderTime ?? ""} onChange={(e) => patch({ reminderTime: e.target.value || null }, "Reminder saved")} className="h-11 rounded-[8px] border-2 border-border bg-bg px-3" />
        </Row>
        <Row label="Use on another device" hint="Copy your player key, or paste one">
          <Button variant="secondary" size="md" onClick={() => setKeyOpen(true)}>Player key</Button>
        </Row>
        <Row label="Onboarding" hint="See the three intro cards again">
          <Button variant="ghost" size="md" onClick={() => { store.set("cd_onboarded", ""); window.location.href = "/"; }}>Replay</Button>
        </Row>
      </section>

      <section id="plus" className="mt-8 rounded-[16px] border border-border p-5">
        <h2 className="t-title">Culturdle+</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[15px]">
          <li>The full archive of past puzzles</li>
          <li>Bank up to five streak freezes</li>
          <li>Stats by decade, and your whole Shelf</li>
          <li>No ads</li>
        </ul>
        <p className="t-meta mt-3 text-muted">{me?.isPlus ? "You have Culturdle+. Thank you." : "The six daily puzzles are always free. Culturdle+ is coming soon."}</p>
      </section>
      <KeySheet open={keyOpen} onClose={() => setKeyOpen(false)} />
    </Page>
  );
}

function KeySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [key, setKey] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (open) api<{ key: string }>("/api/me/key").then((r) => setKey(r.key)); }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="Player key">
      <p className="text-[15px] text-muted">Keep it private: anyone with it can play as you.</p>
      <code className="mt-3 block break-all rounded-[8px] bg-surface p-3 text-[13px]">{key ?? "…"}</code>
      <Button variant="secondary" full className="mt-3" onClick={async () => { if (key) { await navigator.clipboard.writeText(key); setCopied(true); } }}>{copied ? "Copied to clipboard" : "Copy key"}</Button>
      <p className="t-label mb-2 mt-6 text-muted">Continue a profile from another device</p>
      <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste a player key" className="h-12 w-full rounded-[8px] border-2 border-border bg-bg px-4 text-[16px] outline-none focus:border-border-strong" />
      {err && <p className="t-meta mt-1 text-muted">{err}</p>}
      <Button full className="mt-3" disabled={!paste.trim()} onClick={async () => {
        try { await api("/api/me/restore", { method: "POST", json: { key: paste } }); window.location.href = "/"; } catch (e: any) { setErr(e.message); }
      }}>Use this key</Button>
    </Sheet>
  );
}
