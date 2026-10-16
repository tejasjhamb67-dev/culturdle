"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/client/ui";

const TABS = [
  { href: "/", label: "Today", icon: (a: boolean) => <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm0 0 2-4h12l2 4M9 12h6" strokeWidth={a ? 2.2 : 1.7} /> },
  { href: "/leagues", label: "Leagues", icon: (a: boolean) => <path d="M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4Zm10 1h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" strokeWidth={a ? 2.2 : 1.7} /> },
  { href: "/shelf", label: "Shelf", icon: (a: boolean) => <path d="M4 20h16M6 20V6h3v14m1 0V4h3v16m2 0 2.5-13 3 .6L17 20" strokeWidth={a ? 2.2 : 1.7} /> },
  { href: "/profile", label: "Profile", icon: (a: boolean) => <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0" strokeWidth={a ? 2.2 : 1.7} /> },
];

export function TabBar() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" || path.startsWith("/play") : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={active ? "page" : undefined} className={cx("tap flex flex-col items-center gap-0.5 py-2 text-xs", active ? "text-text" : "text-muted")}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {t.icon(active)}
                </svg>
                <span className={cx(active && "font-semibold")}>{t.label}</span>
                <span className={cx("mt-0.5 h-0.5 w-5 rounded-full", active ? "bg-icon" : "bg-transparent")} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
