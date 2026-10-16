"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { cx } from "@/lib/client/copy";

type Tab = "overview" | "puzzles" | "schedule" | "reports" | "stats" | "players";
const STATUSES = ["draft", "reviewed", "live", "retired"] as const;

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => { api("/api/admin/login").then(() => setAuthed(true)).catch(() => setAuthed(false)); }, []);

  if (authed === null) return <p className="mt-20 text-center text-muted">Loading…</p>;
  if (!authed) {
    return (
      <form className="mx-auto mt-24 flex w-full max-w-xs flex-col gap-2" onSubmit={async (e) => {
        e.preventDefault();
        try { await api("/api/admin/login", { method: "POST", json: { password: pw } }); setAuthed(true); } catch (x: any) { setErr(x.message); }
      }}>
        <h1 className="font-serif font-semibold text-4xl">Admin</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="tap rounded-xl border border-border bg-surface px-3" autoFocus />
        {err && <p className="text-sm text-[#c8323a]">{err}</p>}
        <button className="tap rounded-xl bg-correct font-semibold text-on-correct">Sign in</button>
      </form>
    );
  }
  return (
    <div className="fixed inset-0 overflow-auto bg-bg px-4 py-4 sm:px-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-serif font-semibold mr-4 text-4xl">Culturdle Admin</h1>
        {(["overview", "puzzles", "schedule", "reports", "stats", "players"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx("rounded-full border px-4 py-1.5 text-sm font-semibold capitalize", tab === t ? "border-border-strong bg-surface" : "border-border text-muted")}>{t}</button>
        ))}
        <span className="flex-1" />
        <button onClick={async () => { await api("/api/admin/login", { method: "DELETE" }); setAuthed(false); }} className="text-sm text-muted underline">Sign out</button>
      </header>
      {tab === "overview" && <Overview />}
      {tab === "puzzles" && <Puzzles />}
      {tab === "schedule" && <Schedule />}
      {tab === "reports" && <Reports />}
      {tab === "stats" && <Stats />}
      {tab === "players" && <Players />}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-4 rounded-2xl border border-border bg-surface p-4"><h2 className="font-serif font-semibold mb-2 text-2xl">{title}</h2>{children}</section>;
}

function ImportBank({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState("draft");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true); setMsg("Importing… this takes about a minute.");
    try {
      const r = await api("/api/admin/import", { method: "POST", json: { status } });
      setMsg(`Imported ${r.imported}, rejected ${r.rejected}, scheduled ${r.scheduled} new slots.${r.alerts?.length ? " " + r.alerts.join(" ") : ""}`);
      onDone();
    } catch (e: any) { setMsg(e.message); }
    setBusy(false);
  };
  return (
    <Card title="Question bank">
      <p className="mb-2 text-sm text-muted">Imports content/Culturdle_Question_Bank.xlsx from this deployment. New rows get the status below; existing rows keep theirs. The schedule only uses live rows.</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5">
          <option value="draft">New rows as draft</option><option value="reviewed">New rows as reviewed</option><option value="live">New rows as live</option>
        </select>
        <button disabled={busy} onClick={run} className="rounded-full bg-correct px-4 py-1.5 font-semibold text-on-correct disabled:opacity-40">Import</button>
      </div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}

function Overview() {
  const [d, setD] = useState<any>(null);
  const load = () => api("/api/admin/overview").then(setD);
  useEffect(() => { void load(); }, []);
  if (!d) return <p className="text-muted">Loading…</p>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ImportBank onDone={load} />
      <Card title={`Today · ${d.today}`}>
        <p>{d.players} players · {d.dailyActive} played today</p>
        <ul className="mt-2 text-sm text-muted">{d.events.map((e: any) => <li key={e.name}>{e.name}: {e.n} (7d)</li>)}</ul>
      </Card>
      <Card title="Runway (unscheduled live puzzles)">
        <table className="w-full text-sm"><tbody>
          {d.runway.map((r: any) => (
            <tr key={r.edition + r.mode} className={cx(r.alert && "text-[#c8323a]")}><td>{r.edition}</td><td>{r.mode}</td><td className="text-right">{r.live} live</td><td className="text-right">{r.days_left} days{r.alert && " ⚠️"}</td></tr>
          ))}
        </tbody></table>
      </Card>
      <Card title="Puzzle status">
        <table className="w-full text-sm"><tbody>
          {d.counts.map((c: any) => <tr key={c.edition + c.mode + c.status}><td>{c.edition}</td><td>{c.mode}</td><td>{c.status}</td><td className="text-right">{c.n}</td></tr>)}
        </tbody></table>
      </Card>
      <Card title={`Import rejects (${d.rejects.length})`}>
        <div className="max-h-80 overflow-auto text-xs">
          {d.rejects.map((r: any) => <p key={r.row_id} className="border-b border-border py-1"><b>{r.row_id}</b> — {r.errors.join("; ")}</p>)}
        </div>
      </Card>
    </div>
  );
}

function Puzzles() {
  const [f, setF] = useState({ q: "", edition: "", mode: "", difficulty: "", status: "", flag: "" });
  const [page, setPage] = useState(0);
  const [data, setData] = useState<any>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => {
    const sp = new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page: String(page) });
    api(`/api/admin/puzzles?${sp}`).then(setData);
  }, [f, page]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const bulk = async (status: string) => {
    await api("/api/admin/puzzles/status", { method: "POST", json: { ids: [...sel], status } });
    setSel(new Set());
    load();
  };
  const sel_ = "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm";
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={f.q} onChange={(e) => { setPage(0); setF({ ...f, q: e.target.value }); }} placeholder="Search answer, id, hints" className={cx(sel_, "w-64")} />
        {([["edition", ["Global", "India"]], ["mode", ["movie", "music", "icon"]], ["difficulty", ["Easy", "Medium", "Hard"]], ["status", STATUSES], ["flag", ["flagged", "clean"]]] as const).map(([k, opts]) => (
          <select key={k} value={(f as any)[k]} onChange={(e) => { setPage(0); setF({ ...f, [k]: e.target.value }); }} className={sel_}>
            <option value="">{k}: any</option>
            {opts.map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="self-center text-sm text-muted">{data?.total ?? "…"} rows</span>
      </div>
      {sel.size > 0 && (
        <div className="mb-2 flex items-center gap-2 text-sm">
          {sel.size} selected → {STATUSES.map((s) => <button key={s} onClick={() => bulk(s)} className="rounded-full border border-border px-3 py-1 capitalize">{s}</button>)}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface text-left text-muted"><tr>
            <th className="p-2"><input type="checkbox" onChange={(e) => setSel(e.target.checked ? new Set(data?.rows.map((r: any) => r.id)) : new Set())} /></th>
            <th>ID</th><th>Answer</th><th>Type</th><th>Diff</th><th>Status</th><th>Flag</th><th>Next</th><th>Reports</th>
          </tr></thead>
          <tbody>
            {data?.rows.map((r: any) => (
              <tr key={r.id} className="cursor-pointer border-t border-border hover:bg-surface" onClick={() => setOpen(r.id)}>
                <td className="p-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(r.id)} onChange={(e) => { const s = new Set(sel); e.target.checked ? s.add(r.id) : s.delete(r.id); setSel(s); }} /></td>
                <td className="font-mono text-xs">{r.id}</td><td className="font-semibold">{r.answer}</td><td>{r.answer_type}</td><td>{r.difficulty}</td>
                <td><span className={cx("rounded-full px-2 py-0.5 text-xs", r.status === "live" ? "bg-correct text-on-correct" : r.status === "retired" ? "bg-border" : "bg-present/30")}>{r.status}</span></td>
                <td className="max-w-48 truncate text-xs text-muted" title={r.verify_flag ?? ""}>{r.verify_flag}</td>
                <td className="text-xs">{r.next_scheduled}</td><td>{r.open_reports || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex gap-2">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border border-border px-3 py-1 disabled:opacity-30">←</button>
        <span className="text-sm text-muted">page {page + 1} / {data ? Math.max(1, Math.ceil(data.total / 50)) : 1}</span>
        <button disabled={!data || (page + 1) * 50 >= data.total} onClick={() => setPage(page + 1)} className="rounded border border-border px-3 py-1 disabled:opacity-30">→</button>
      </div>
      {open && <PuzzleEditor id={open} onClose={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function PuzzleEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const [d, setD] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    api(`/api/admin/puzzles/${id}`).then((r) => {
      setD(r);
      setForm({ answer: r.puzzle.answer, hints: r.puzzle.hints, wrongOptions: r.puzzle.wrong_options, revealFact: r.puzzle.reveal_fact ?? "", aliases: (r.puzzle.aliases ?? []).join(" | "), difficulty: r.puzzle.difficulty, verifyFlag: r.puzzle.verify_flag ?? "" });
    });
  }, [id]);
  const save = async (extra: Record<string, unknown> = {}) => {
    setMsg(null);
    try {
      const r = await api(`/api/admin/puzzles/${id}`, { method: "PATCH", json: { ...form, aliases: form.aliases.split("|").map((s: string) => s.trim()).filter(Boolean), verifyFlag: form.verifyFlag || null, ...extra } });
      setD({ ...d, puzzle: r.puzzle });
      setMsg("Saved ✓");
    } catch (e: any) { setMsg(e.message); }
  };
  const inp = "w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div className="h-full w-full max-w-2xl overflow-auto bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        {!form ? <p>Loading…</p> : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif font-semibold text-3xl">{d.puzzle.id} · <span className="text-text">{d.puzzle.status}</span></h2>
              <button onClick={onClose} className="text-2xl text-muted">×</button>
            </div>
            <p className="mb-3 text-xs text-muted">{d.puzzle.edition} · {d.puzzle.mode} · {d.puzzle.answer_type} · {d.puzzle.category} · {d.puzzle.year} · {d.puzzle.source}</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {[["reviewed", "Mark reviewed"], ["live", "Make live"], ["retired", "Retire"], ["draft", "Back to draft"]].map(([s, l]) => (
                <button key={s} onClick={() => save({ status: s })} className="rounded-full border border-border px-3 py-1 text-sm">{l}</button>
              ))}
            </div>
            <label className="mb-2 block text-sm">Answer<input className={inp} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></label>
            <label className="mb-2 block text-sm">Aliases (separate with |)<input className={inp} value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} /></label>
            {form.hints.map((h: string, i: number) => (
              <label key={i} className="mb-2 block text-sm">Hint {i + 1}<textarea rows={i === 2 ? 3 : 1} className={inp} value={h} onChange={(e) => { const hs = [...form.hints]; hs[i] = e.target.value; setForm({ ...form, hints: hs }); }} /></label>
            ))}
            <div className="mb-2 grid grid-cols-3 gap-2">
              {form.wrongOptions.map((o: string, i: number) => (
                <label key={i} className="text-sm">Wrong {String.fromCharCode(65 + i)}<input className={inp} value={o} onChange={(e) => { const w = [...form.wrongOptions]; w[i] = e.target.value; setForm({ ...form, wrongOptions: w }); }} /></label>
              ))}
            </div>
            <label className="mb-2 block text-sm">Reveal-card fact<textarea rows={2} className={inp} value={form.revealFact} onChange={(e) => setForm({ ...form, revealFact: e.target.value })} /></label>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="text-sm">Difficulty<select className={inp} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
              <label className="text-sm">Verify flag (clear when checked)<input className={inp} value={form.verifyFlag} onChange={(e) => setForm({ ...form, verifyFlag: e.target.value })} /></label>
            </div>
            <button onClick={() => save()} className="mt-2 rounded-xl bg-correct px-5 py-2 font-semibold text-on-correct">Save</button>
            {msg && <span className="ml-3 text-sm">{msg}</span>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Card title="Live stats">
                <p className="text-sm">{d.stats.plays} finished · {d.stats.plays ? Math.round((100 * d.stats.solved) / d.stats.plays) : 0}% solved</p>
                <p className="text-xs text-muted">By guess: {d.stats.distribution.join(" · ")}</p>
              </Card>
              <Card title="Scheduled">
                {d.schedule.length ? d.schedule.map((s: any) => <p key={s.play_date} className="text-sm">{s.play_date} (#{s.puzzle_number})</p>) : <p className="text-sm text-muted">Not scheduled</p>}
              </Card>
            </div>
            {d.reports.length > 0 && (
              <Card title="Reports">{d.reports.map((r: any) => <p key={r.id} className="border-b border-border py-1 text-sm">{r.resolved ? "✓ " : ""}{r.message}</p>)}</Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Schedule() {
  const [from, setFrom] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [drag, setDrag] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ov, setOv] = useState({ date: "", edition: "Global", mode: "movie", puzzleId: "", note: "" });
  const load = useCallback(() => api(`/api/admin/schedule${from ? `?from=${from}` : ""}`).then(setData), [from]);
  useEffect(() => { void load(); }, [load]);
  const pools = [["Global", "movie"], ["Global", "music"], ["Global", "icon"], ["India", "movie"], ["India", "music"], ["India", "icon"]];
  const dates: string[] = data ? [...new Set<string>(data.rows.map((r: any) => r.play_date))] : [];
  const cell = (date: string, e: string, m: string) => data.rows.find((r: any) => r.play_date === date && r.edition === e && r.mode === m);
  const swap = async (a: any, b: any) => {
    setMsg(null);
    try { await api("/api/admin/schedule/swap", { method: "POST", json: { a: a.play_date, b: b.play_date, edition: a.edition, mode: a.mode } }); load(); }
    catch (e: any) { setMsg(e.message); }
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1" />
        <button onClick={async () => { const r = await api("/api/admin/schedule", { method: "POST" }); setMsg(`Scheduled ${r.added} slots. ${r.alerts.join(" ")}`); load(); }} className="rounded-full border border-border px-3 py-1">Run scheduler</button>
        <span className="text-muted">Drag a future cell onto another day in the same column to swap.</span>
        {msg && <span className="text-text">{msg}</span>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1000px] text-xs">
          <thead className="bg-surface text-left text-muted"><tr><th className="p-2">Date</th>{pools.map(([e, m]) => <th key={e + m}>{e} {m}</th>)}</tr></thead>
          <tbody>
            {dates.map((d) => (
              <tr key={d} className={cx("border-t border-border", d === data.today && "bg-surface")}>
                <td className="p-2 font-semibold">{d}<br /><span className="text-muted">{new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}</span></td>
                {pools.map(([e, m]) => {
                  const c = cell(d, e, m);
                  if (!c) return <td key={e + m} />;
                  const future = d > data.today;
                  return (
                    <td key={e + m} className="p-1">
                      <div
                        draggable={future}
                        onDragStart={() => setDrag(c)}
                        onDragOver={(ev) => future && drag && drag.edition === e && drag.mode === m && ev.preventDefault()}
                        onDrop={() => { if (drag && drag.play_date !== d) void swap(drag, c); setDrag(null); }}
                        className={cx("rounded-lg border border-border p-1.5", future && "cursor-grab", c.overridden && "border-present")}
                        title={c.puzzle_id}
                      >
                        <b>{c.answer}</b>
                        <div className="text-muted">{c.difficulty} · {c.status}{c.verify_flag ? " · ⚑" : ""}</div>
                        {c.finished > 0 && <div>{c.finished} done · {Math.round((100 * c.solved) / c.finished)}%</div>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="Calendar override (birthdays, releases, festivals)">
        <div className="flex flex-wrap gap-2 text-sm">
          <input type="date" value={ov.date} onChange={(e) => setOv({ ...ov, date: e.target.value })} className="rounded-lg border border-border bg-bg px-2 py-1" />
          <select value={ov.edition} onChange={(e) => setOv({ ...ov, edition: e.target.value })} className="rounded-lg border border-border bg-bg px-2"><option>Global</option><option>India</option></select>
          <select value={ov.mode} onChange={(e) => setOv({ ...ov, mode: e.target.value })} className="rounded-lg border border-border bg-bg px-2"><option>movie</option><option>music</option><option>icon</option></select>
          <input value={ov.puzzleId} onChange={(e) => setOv({ ...ov, puzzleId: e.target.value })} placeholder="Puzzle ID e.g. MOV-I-00042" className="rounded-lg border border-border bg-bg px-2 py-1" />
          <input value={ov.note} onChange={(e) => setOv({ ...ov, note: e.target.value })} placeholder="Note" className="rounded-lg border border-border bg-bg px-2 py-1" />
          <button onClick={async () => { try { await api("/api/admin/schedule/override", { method: "POST", json: ov }); setMsg("Override saved"); load(); } catch (e: any) { setMsg(e.message); } }} className="rounded-full bg-correct px-4 py-1 font-semibold text-on-correct">Pin</button>
        </div>
      </Card>
    </div>
  );
}

function Reports() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => api("/api/admin/reports").then((r) => setRows(r.rows));
  useEffect(() => { void load(); }, []);
  return (
    <Card title={`Open reports (${rows.length})`}>
      {rows.length === 0 && <p className="text-muted">Inbox zero.</p>}
      {rows.map((r) => (
        <div key={r.id} className="flex items-start gap-3 border-b border-border py-2 text-sm">
          <div className="flex-1"><b>{r.answer}</b> <span className="font-mono text-xs text-muted">{r.puzzle_id} · {r.edition} {r.mode}</span><p>{r.message}</p><p className="text-xs text-muted">{new Date(r.created_at).toLocaleString()}</p></div>
          <button onClick={async () => { await api(`/api/admin/reports/${r.id}`, { method: "PATCH", json: { resolved: true } }); load(); }} className="rounded-full border border-border px-3 py-1">Resolve</button>
        </div>
      ))}
    </Card>
  );
}

function Stats() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/api/admin/stats").then((r) => setRows(r.rows)); }, []);
  return (
    <Card title="Solve rates (target 75–90%)">
      <table className="w-full text-sm">
        <thead className="text-left text-muted"><tr><th>Puzzle</th><th>Pool</th><th>Label</th><th>Plays</th><th>Solved</th><th>Median guess</th><th>Suggest</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-t border-border"><td>{r.answer}</td><td>{r.edition} {r.mode}</td><td>{r.difficulty}</td><td>{r.plays}</td>
            <td className={cx(r.solve_rate < 60 || r.solve_rate > 97 ? "text-[#c8323a]" : r.solve_rate >= 75 && r.solve_rate <= 90 ? "text-correct" : "")}>{r.solve_rate}%</td>
            <td>{r.median_guess ?? "—"}</td><td>{r.suggested_difficulty ?? "needs 30 plays"}</td></tr>
        ))}</tbody>
      </table>
    </Card>
  );
}

function Players() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const go = async (plus: boolean) => {
    try { const r = await api("/api/admin/players", { method: "POST", json: { code, plus } }); setMsg(`${r.handle ?? r.friend_code}: Culturdle+ ${r.is_plus ? "on" : "off"}`); }
    catch (e: any) { setMsg(e.message); }
  };
  return (
    <Card title="Culturdle+ access">
      <div className="flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Friend code" className="rounded-lg border border-border bg-bg px-2 py-1" />
        <button onClick={() => go(true)} className="rounded-full bg-correct px-4 font-semibold text-on-correct">Grant</button>
        <button onClick={() => go(false)} className="rounded-full border border-border px-4">Remove</button></div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
