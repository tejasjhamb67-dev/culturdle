"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { Page } from "@/components/Page";
import { ButtonLink } from "@/components/Button";

/** One link for both kinds: 6-character codes are friends, 8-character codes are groups. */
export default function Invite({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [state, setState] = useState<{ ok: boolean; title: string; text: string } | null>(null);
  useEffect(() => {
    const c = code.toUpperCase();
    const run = c.length === 8
      ? api<{ name: string }>("/api/groups/join", { method: "POST", json: { code: c } }).then((g) => ({ ok: true, title: "You’re in", text: `You joined “${g.name}”. Your points count in its weekly league.` }))
      : api<{ name: string }>("/api/friends", { method: "POST", json: { code: c } }).then((f) => ({ ok: true, title: "Friends", text: `You and ${f.name} now share a weekly league.` }));
    run.then(setState).catch((e) => setState({ ok: false, title: "That link didn’t work", text: e.message }));
  }, [code]);
  return (
    <Page title={state?.title ?? "Joining…"} subtitle={state?.text}>
      {state && (
        <div className="flex flex-col gap-2.5">
          <ButtonLink full href="/">Play today’s puzzles</ButtonLink>
          {state.ok && <ButtonLink full variant="secondary" href="/leaderboard">See the leaderboard</ButtonLink>}
        </div>
      )}
    </Page>
  );
}
