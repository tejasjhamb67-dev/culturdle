"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client/api";

export default function JoinFriend({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    api<{ name: string }>("/api/friends", { method: "POST", json: { code } })
      .then((f) => setState({ ok: true, text: `You and ${f.name} are now friends. Your scores share a weekly league.` }))
      .catch((e) => setState({ ok: false, text: e.message }));
  }, [code]);
  return (
    <main className="mt-24 text-center">
      <p className="font-display text-5xl">{state ? (state.ok ? "Friends!" : "Hmm.") : "Adding…"}</p>
      <p className="mt-2 text-muted">{state?.text}</p>
      <Link href="/" className="tap mt-6 inline-flex items-center rounded-full bg-icon px-6 font-semibold text-black">Play today’s puzzles</Link>
    </main>
  );
}
