"use client";

import { useCallback, useEffect, useState } from "react";
import type { Edition } from "@culturdle/core";
import { api, trackClient } from "@/lib/client/api";
import type { LeagueRow, Me } from "@/lib/client/types";
import { cx } from "@/lib/client/ui";
import { Header } from "@/components/Header";
import { Sheet } from "@/components/Sheet";

type Tab = "friends" | "groups" | "global";
interface Group { id: string; name: string; invite_code: string; members: number }

function Table({ rows, me, empty }: { rows: LeagueRow[]; me?: LeagueRow | null; empty: string }) {
  if (!rows.length) return <p className="py-8 text-center text-muted">{empty}</p>;
  const showMe = me && !rows.some((r) => r.me);
  return (
    <ol className="flex flex-col gap-1.5">
      {[...rows, ...(showMe ? [me!] : [])].map((r, i) => (
        <li key={r.playerId + i} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5", r.me ? "border border-icon/50 bg-icon/10" : "bg-surface", showMe && i === rows.length && "mt-3")}>
          <span className={cx("font-display w-8 text-center text-2xl", r.rank === 1 ? "text-icon" : r.rank <= 3 ? "text-text" : "text-muted")}>{r.rank}</span>
          <span className="flex-1 truncate font-medium">{r.name}{r.me && <span className="ml-1 text-xs text-muted">(you)</span>}</span>
          <span className="text-sm text-muted" aria-label={`${r.streak}-day streak`}>🔥 {r.streak}</span>
          <span className="font-display w-12 text-right text-2xl">{r.score}</span>
        </li>
      ))}
    </ol>
  );
}

export default function Leagues() {
  const [tab, setTab] = useState<Tab>("friends");
  const [me, setMe] = useState<Me | null>(null);
  const [friends, setFriends] = useState<{ rows: LeagueRow[]; me: LeagueRow | null; from: string } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [group, setGroup] = useState<string | null>(null);
  const [groupBoard, setGroupBoard] = useState<{ rows: LeagueRow[]; me: LeagueRow | null } | null>(null);
  const [edition, setEdition] = useState<Edition>("Global");
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [global, setGlobal] = useState<{ rows: LeagueRow[]; me: LeagueRow | null; total: number } | null>(null);
  const [sheet, setSheet] = useState<"friend" | "group" | "join" | null>(null);

  const loadFriends = useCallback(() => api("/api/leagues/friends").then(setFriends), []);
  const loadGroups = useCallback(() => api<{ groups: Group[] }>("/api/groups").then((r) => {
    setGroups(r.groups);
    setGroup((g) => g ?? r.groups[0]?.id ?? null);
  }), []);

  useEffect(() => {
    api<Me>("/api/me").then((m) => { setMe(m); setEdition(m.homeEdition); });
    void loadFriends();
    void loadGroups();
    trackClient("league_view");
  }, [loadFriends, loadGroups]);
  useEffect(() => { if (tab === "global") api(`/api/leagues/global?edition=${edition}&period=${period}`).then(setGlobal); }, [tab, edition, period]);
  useEffect(() => { if (group) api(`/api/leagues/group/${group}`).then(setGroupBoard).catch(() => setGroupBoard(null)); }, [group]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const invite = (text: string, url: string) => {
    trackClient("invite_sent", { url });
    if (navigator.share) void navigator.share({ text, url }).catch(() => {});
    else void navigator.clipboard.writeText(`${text} ${url}`);
  };

  return (
    <>
      <Header streak={me?.streak.current} />
      <h1 className="font-display mb-3 text-5xl leading-none">Leagues</h1>
      <div role="tablist" className="mb-4 grid grid-cols-3 rounded-2xl border border-line bg-surface p-1">
        {(["friends", "groups", "global"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx("tap rounded-xl text-sm font-semibold capitalize", tab === t ? "bg-surface-2 text-text" : "text-muted")}>
            {t === "global" ? "Global / India" : t}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <section>
          <p className="mb-3 text-sm text-muted">This week · both editions · resets every Monday 00:00 IST</p>
          <Table rows={friends?.rows ?? []} empty="Loading…" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => me && invite(`Play Culturdle with me! My friend code is ${me.friendCode}.`, `${origin}/join/friend/${me.friendCode}`)} className="tap rounded-2xl bg-icon font-semibold text-black">Invite a friend</button>
            <button onClick={() => setSheet("friend")} className="tap rounded-2xl border border-line bg-surface font-semibold">Add by code</button>
          </div>
          {me && <p className="mt-3 text-center text-sm text-muted">Your friend code: <span className="font-display text-xl tracking-widest text-text">{me.friendCode}</span></p>}
        </section>
      )}

      {tab === "groups" && (
        <section>
          {groups.length > 0 && (
            <div className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
              {groups.map((g) => (
                <button key={g.id} onClick={() => setGroup(g.id)} className={cx("tap shrink-0 rounded-full border px-4 text-sm font-semibold", group === g.id ? "border-icon bg-icon/15" : "border-line bg-surface text-muted")}>
                  {g.name} · {g.members}
                </button>
              ))}
            </div>
          )}
          {groups.length === 0 ? (
            <p className="py-6 text-center text-muted">Make a private league for your office, family or college.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">This week · both editions</p>
              <Table rows={groupBoard?.rows ?? []} me={groupBoard?.me} empty="Loading…" />
              {group && (
                <button
                  onClick={() => { const g = groups.find((x) => x.id === group)!; invite(`Join my Culturdle league "${g.name}"`, `${origin}/join/group/${g.invite_code}`); }}
                  className="tap mt-4 w-full rounded-2xl bg-icon font-semibold text-black"
                >
                  Share invite link
                </button>
              )}
            </>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setSheet("group")} className="tap rounded-2xl border border-line bg-surface font-semibold">New group</button>
            <button onClick={() => setSheet("join")} className="tap rounded-2xl border border-line bg-surface font-semibold">Join with code</button>
          </div>
        </section>
      )}

      {tab === "global" && (
        <section>
          <div className="mb-3 flex gap-2">
            {(["Global", "India"] as Edition[]).map((e) => (
              <button key={e} onClick={() => setEdition(e)} className={cx("tap rounded-full border px-4 text-sm font-semibold", edition === e ? "border-icon bg-icon/15" : "border-line text-muted")}>{e === "India" ? "🇮🇳" : "🌍"} {e}</button>
            ))}
            <span className="flex-1" />
            {(["day", "week"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cx("tap rounded-full border px-4 text-sm font-semibold", period === p ? "border-text" : "border-line text-muted")}>{p === "day" ? "Today" : "Week"}</button>
            ))}
          </div>
          <p className="mb-3 text-sm text-muted">Top 100 · {global?.total ?? 0} players{global?.me ? ` · you are #${global.me.rank}` : ""}</p>
          <Table rows={global?.rows ?? []} me={global?.me} empty="No finished puzzles yet today. Be the first!" />
        </section>
      )}

      <CodeSheet
        open={sheet !== null}
        kind={sheet}
        onClose={() => setSheet(null)}
        onDone={() => { setSheet(null); void loadFriends(); void loadGroups(); }}
      />
    </>
  );
}

function CodeSheet({ open, kind, onClose, onDone }: { open: boolean; kind: "friend" | "group" | "join" | null; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const title = kind === "friend" ? "Add a friend" : kind === "group" ? "New group" : "Join a group";
  const submit = async () => {
    setErr(null);
    try {
      if (kind === "friend") await api("/api/friends", { method: "POST", json: { code: v } });
      if (kind === "group") await api("/api/groups", { method: "POST", json: { name: v } });
      if (kind === "join") await api("/api/groups/join", { method: "POST", json: { code: v } });
      setV("");
      onDone();
    } catch (e: any) {
      setErr(e.message);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={kind === "group" ? "Group name (e.g. Office Quiz Club)" : kind === "friend" ? "Friend code or name" : "Invite code"}
        className="tap w-full rounded-2xl border border-line bg-bg px-4 text-[16px] outline-none"
        autoFocus
      />
      {err && <p className="mt-2 text-sm text-movie">{err}</p>}
      <button onClick={submit} disabled={!v.trim()} className="tap mt-3 w-full rounded-2xl bg-icon font-semibold text-black disabled:opacity-40">
        {kind === "group" ? "Create" : kind === "friend" ? "Add friend" : "Join"}
      </button>
    </Sheet>
  );
}
