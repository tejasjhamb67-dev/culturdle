"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ChartColumn, CircleHelp, Menu, Settings } from "lucide-react";
import type { Edition, Mode } from "@culturdle/core";
import { api, store, trackClient } from "@/lib/client/api";
import type { DayView, Tile } from "@/lib/client/types";
import { cx, MODE_LABEL, playHref } from "@/lib/client/copy";
import { Wordmark } from "./Wordmark";
import { Sheet } from "./Sheet";
import { StatusPill, type Status } from "./StatusPill";
import { HowToPlay } from "./HowToPlay";
import { StatsSheet } from "./StatsSheet";
import { Onboarding } from "./Onboarding";

export function tileStatus(t?: Tile): Status {
  if (!t) return "play";
  if (t.status === "solved" && t.pips.at(-1) === "options") return "options";
  return t.status;
}

interface ShellCtx {
  day: DayView | null;
  refreshDay: () => Promise<void>;
  openStats: (edition?: Edition, mode?: Mode) => void;
  openHelp: () => void;
  current: { edition: Edition; mode: Mode };
  setCurrent: (edition: Edition, mode: Mode) => void;
}
const Ctx = createContext<ShellCtx | null>(null);
export const useShell = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShell outside Shell");
  return c;
};

const NAV = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/archive", label: "Archive" },
  { href: "/shelf", label: "Shelf" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [day, setDay] = useState<DayView | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [help, setHelp] = useState(false);
  const [stats, setStats] = useState<{ edition: Edition; mode: Mode } | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [current, setCurrentState] = useState<{ edition: Edition; mode: Mode }>({ edition: "Global", mode: "movie" });

  const refreshDay = useCallback(async () => {
    try {
      setDay(await api<DayView>("/api/today"));
    } catch {}
  }, []);

  useEffect(() => {
    void refreshDay();
    trackClient("app_open", { signed_in: false });
    if (!store.get("cd_onboarded")) setOnboarding(true);
  }, [refreshDay]);

  useEffect(() => setDrawer(false), [path]);

  const setCurrent = useCallback((edition: Edition, mode: Mode) => {
    setCurrentState((c) => (c.edition === edition && c.mode === mode ? c : { edition, mode }));
    store.set("cd_last", `${edition}|${mode}`);
  }, []);

  const value = useMemo<ShellCtx>(
    () => ({
      day, refreshDay, current, setCurrent,
      openStats: (edition, mode) => setStats({ edition: edition ?? current.edition, mode: mode ?? current.mode }),
      openHelp: () => setHelp(true),
    }),
    [day, refreshDay, current, setCurrent],
  );

  if (path.startsWith("/admin")) return <>{children}</>;

  return (
    <Ctx.Provider value={value}>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
        <div className="relative mx-auto flex h-14 max-w-[1440px] items-center justify-between px-2 lg:h-[64px] lg:px-8">
          {/* phone/tablet: menu · wordmark · help/stats/settings */}
          <button onClick={() => setDrawer(true)} aria-label="Menu" className="flex h-11 w-11 items-center justify-center lg:hidden">
            <Menu size={22} />
          </button>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            <Link href="/" className="text-[17px] font-bold">Culturdle</Link>
            <button onClick={() => setHelp(true)} className="text-[15px] text-muted hover:text-text">How to play</button>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined} className={cx("text-[15px] hover:text-text", path.startsWith(n.href) ? "font-semibold text-text" : "text-muted")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="flex flex-1 justify-center lg:hidden" aria-label="Culturdle — today's puzzles">
            <Wordmark size={17} />
          </Link>
          <Link href="/" className="absolute left-1/2 hidden -translate-x-1/2 lg:block" aria-label="Culturdle — today's puzzles">
            <Wordmark size={26} />
          </Link>
          <div className="flex items-center">
            <button onClick={() => setHelp(true)} aria-label="How to play" className="flex h-11 w-10 items-center justify-center lg:hidden"><CircleHelp size={22} /></button>
            <button onClick={() => value.openStats()} aria-label="Statistics" className="flex h-11 w-10 items-center justify-center lg:w-11"><ChartColumn size={22} /></button>
            <Link href="/settings" aria-label="Settings" className="flex h-11 w-10 items-center justify-center lg:hidden"><Settings size={22} /></Link>
            <Link href="/settings" className="t-button ml-2 hidden h-11 items-center rounded-full border-[1.5px] border-border-strong px-6 lg:inline-flex">Settings</Link>
          </div>
        </div>
      </header>

      {children}

      <Sheet open={drawer} onClose={() => setDrawer(false)} title="Today">
        <DrawerBody day={day} onHelp={() => { setDrawer(false); setHelp(true); }} onStats={() => { setDrawer(false); value.openStats(); }} />
      </Sheet>
      <Sheet open={help} onClose={() => setHelp(false)} title="How to play">
        <HowToPlay />
      </Sheet>
      {stats && <StatsSheet edition={stats.edition} mode={stats.mode} onClose={() => setStats(null)} />}
      {onboarding && (
        <Onboarding
          onDone={async (edition) => {
            store.set("cd_onboarded", "1");
            setOnboarding(false);
            if (edition) {
              await api("/api/me", { method: "PATCH", json: { homeEdition: edition } }).catch(() => {});
              window.location.href = playHref(edition, "movie");
            }
          }}
        />
      )}
    </Ctx.Provider>
  );
}

function DrawerBody({ day, onHelp, onStats }: { day: DayView | null; onHelp: () => void; onStats: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      {day?.editions.map((ed) => (
        <section key={ed.edition}>
          <p className="t-label mb-2 text-muted">{ed.edition} edition · No. {ed.puzzleNumber}</p>
          <ul className="flex flex-col gap-2">
            {ed.tiles.map((t) => (
              <li key={t.mode}>
                <Link href={playHref(ed.edition, t.mode)} className="flex h-14 items-center justify-between rounded-[10px] border border-border px-4">
                  <span>
                    <span className="t-headline block leading-5">{MODE_LABEL[t.mode]}</span>
                    <span className="t-meta text-muted">{t.prompt}</span>
                  </span>
                  <StatusPill status={tileStatus(t)} guesses={t.guessesUsed} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <nav className="flex flex-col border-t border-border pt-2" aria-label="More">
        {[...NAV, { href: "/settings", label: "Settings" }].map((n) => (
          <Link key={n.href} href={n.href} className="flex h-12 items-center text-[17px]">{n.label}</Link>
        ))}
        <button onClick={onStats} className="flex h-12 items-center text-left text-[17px]">Statistics</button>
        <button onClick={onHelp} className="flex h-12 items-center text-left text-[17px]">How to play</button>
      </nav>
    </div>
  );
}
