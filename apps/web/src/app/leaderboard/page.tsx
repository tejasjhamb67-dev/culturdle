"use client";

import { useCallback, useEffect, useState } from "react";
import type { Edition } from "@culturdle/core";
import { api, trackClient } from "@/lib/client/api";
import type { LeagueRow, Me } from "@/lib/client/types";
import { COPY, cx } from "@/lib/client/copy";
import { Page } from "@/components/Page";
import { Segmented } from "@/components/Segmented";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { useToast } from "@/components/Toast";

type Tab = "friends" | "groups" | "global";
interface Group { id: string; name: string; invite_code: string; members: number }
interface Board { rows: LeagueRow[]; me: LeagueRow | null; total?: number; from?: string; to?: string }

function Rows({ board, empty }: { board: Board | null; empty: string }) {
  if (!board) return <div className="h-40 animate-pulse rounded-[10px] bg-surface" />;
  if (board.rows.length === 0) return <p className="py-10 text-center text-muted">{empty}</p>;
  const extra = board.me && !board.rows.some((r) => r.me) ? [board.me] : [];
  return (
    <ol className="flex flex-col">
      {[...board.rows, ...extra].map((r, i) => (
        <li key={r.playerId + i} className={cx("-mx-4 flex h-16 items-center gap-3 px-4", r.me ? "rounded-[10px] bg-surface" : "border-b border-border")}>
          <span className="w-6 text-[17px] font-semibold text-muted">{r.score > 0 ? r.rank : "–"}</span>
          <Avatar name={r.name} me={r.me} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-semibold leading-6">{r.me ? "You" : r.name}</span>
            <span className="t-meta text-muted">{r.streak > 0 ? `${r.streak}-day streak` : "No streak"}</span>
          </span>
          <span className="text-[17px] font-bold tabular-nums">{r.score}<span className="t-meta ml-1 font-normal text-muted">pts</span></span>
        </li>
      ))}
    </ol>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>("friends");
  const [me, setMe] = useState<Me | null>(null);
  const [friends, setFriends] = useState<Board | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [groupBoard, setGroupBoard] = useState<Board | null>(null);
  const [edition, setEdition] = useState<Edition>("Global");
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [global, setGlobal] = useState<Board | null>(null);
  const [sheet, setSheet] = useState<"friend" | "group" | "join" | null>(null);
  const toast = useToast();

  const loadFriends = useCallback(() => api<Board>("/api/leagues/friends").then(setFriends), []);
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
  useEffect(() => {
    if (tab !== "global") return;
    setGlobal(null);
    api<Board>(`/api/leagues/global?edition=${edition}&period=${period}`).then(setGlobal);
  }, [tab, edition, period]);
  useEffect(() => {
    if (!group) return;
    setGroupBoard(null);
    api<Board>(`/api/leagues/group/${group}`).then(setGroupBoard).catch(() => setGroupBoard({ rows: [], me: null }));
  }, [group]);

  const invite = async (text: string, path: string) => {
    const url = `${window.location.origin}${path}`;
    trackClient("invite_sent", { path });
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`).catch(() => {});
      toast.show(COPY.copied);
    }
  };

  const subtitle = tab === "global" ? `${edition} edition · ${period === "day" ? "today" : "this week"}` : "This week · both editions · resets Monday, midnight IST";

  return (
    <Page title={tab === "global" && period === "day" ? "Today’s leaderboard" : "This week’s league"} subtitle={subtitle}>
      {toast.node}
      <Segmented label="Leaderboard" value={tab} onChange={setTab} options={[{ value: "friends", label: "Friends" }, { value: "groups", label: "Groups" }, { value: "global", label: "Global" }]} />

      <div className="mt-4">
        {tab === "friends" && (
          <>
            <Rows board={friends} empty={COPY.emptyFriends} />
            {friends && friends.rows.length <= 1 && <p className="mt-4 text-center text-[15px] text-muted">{COPY.emptyFriends}</p>}
            <div className="mt-6 flex flex-col gap-2.5">
              <Button variant="secondary" full onClick={() => me && invite(`Play Culturdle with me — my friend code is ${me.friendCode}.`, `/invite/${me.friendCode}`)}>Invite friends</Button>
              <Button variant="ghost" full onClick={() => setSheet("friend")}>Add a friend by code</Button>
            </div>
            {me && <p className="t-meta mt-2 text-center text-muted">Your friend code <b className="text-[15px] tracking-[0.15em] text-text">{me.friendCode}</b></p>}
          </>
        )}

        {tab === "groups" && (
          <>
            {groups && groups.length > 0 && (
              <div className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
                {groups.map((g) => (
                  <button key={g.id} onClick={() => setGroup(g.id)} className={cx("t-chip h-8 shrink-0 rounded-full border px-3.5", group === g.id ? "border-border-strong bg-surface text-text" : "border-border text-muted")}>
                    {g.name} · {g.members}
                  </button>
                ))}
              </div>
            )}
            {groups && groups.length === 0 ? (
              <p className="py-8 text-center text-muted">Make a private league for your office, family or college.</p>
            ) : (
              <Rows board={groupBoard} empty="No one has played yet this week." />
            )}
            <div className="mt-6 flex flex-col gap-2.5">
              {group && groups && (
                <Button full onClick={() => { const g = groups.find((x) => x.id === group)!; invite(`Join my Culturdle league “${g.name}”`, `/invite/${g.invite_code}`); }}>Share invite link</Button>
              )}
              <Button variant="secondary" full onClick={() => setSheet("group")}>New group</Button>
              <Button variant="ghost" full onClick={() => setSheet("join")}>Join with a code</Button>
            </div>
          </>
        )}

        {tab === "global" && (
          <>
            <div className="mb-4 flex gap-2">
              <Segmented className="flex-1" label="Edition" value={edition} onChange={setEdition} options={[{ value: "Global", label: "Global" }, { value: "India", label: "India" }]} />
              <Segmented className="flex-1" label="Period" value={period} onChange={setPeriod} options={[{ value: "day", label: "Today" }, { value: "week", label: "Week" }]} />
            </div>
            <Rows board={global} empty="No finished puzzles yet. Be the first." />
            {global?.me && <p className="t-meta mt-3 text-center text-muted">You are #{global.me.rank} of {global.total}</p>}
          </>
        )}
      </div>

      <CodeSheet kind={sheet} onClose={() => setSheet(null)} onDone={() => { setSheet(null); void loadFriends(); void loadGroups(); }} />
    </Page>
  );
}

function CodeSheet({ kind, onClose, onDone }: { kind: "friend" | "group" | "join" | null; onClose: () => void; onDone: () => void }) {
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
    <Sheet open={kind !== null} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={kind === "group" ? "Group name, e.g. Office quiz club" : kind === "friend" ? "Friend code or display name" : "Invite code"}
          className="h-12 rounded-[8px] border-2 border-border bg-bg px-4 text-[16px] outline-none focus:border-border-strong"
          autoFocus
        />
        {err && <p className="text-[15px] text-muted">{err}</p>}
        <Button full onClick={submit} disabled={!v.trim()}>{kind === "group" ? "Create group" : kind === "friend" ? "Add friend" : "Join group"}</Button>
      </div>
    </Sheet>
  );
}
