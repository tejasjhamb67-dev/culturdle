"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client/api";

export default function JoinGroup({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    api<{ name: string }>("/api/groups/join", { method: "POST", json: { code } })
      .then((g) => setState({ ok: true, text: `You joined “${g.name}”.` }))
      .catch((e) => setState({ ok: false, text: e.message }));
  }, [code]);
  return (
    <main className="mt-24 text-center">
      <p className="font-display text-5xl">{state ? (state.ok ? "You're in!" : "Hmm.") : "Joining…"}</p>
      <p className="mt-2 text-muted">{state?.text}</p>
      <Link href={state?.ok ? "/leagues" : "/"} className="tap mt-6 inline-flex items-center rounded-full bg-icon px-6 font-semibold text-black">{state?.ok ? "See the league" : "Play today"}</Link>
    </main>
  );
}
