"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Edition, Mode } from "@culturdle/core";
import { api, store } from "@/lib/client/api";
import { playHref } from "@/lib/client/copy";
import { Wordmark } from "@/components/Wordmark";

/** "/" opens the last mode played, else the home edition's film puzzle (Foodle §5.1). */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const last = store.get("cd_last");
    if (last) {
      const [e, m] = last.split("|") as [Edition, Mode];
      router.replace(playHref(e, m));
      return;
    }
    api<{ homeEdition: Edition }>("/api/me")
      .then((me) => router.replace(playHref(me.homeEdition, "movie")))
      .catch(() => router.replace(playHref("Global", "movie")));
  }, [router]);
  return (
    <main className="flex min-h-[60dvh] items-center justify-center">
      <Wordmark size={28} className="animate-pulse" />
    </main>
  );
}
