import type { Mode } from "@culturdle/core";

export const MODE_META: Record<Mode, { label: string; emoji: string; color: string; glyph: string }> = {
  movie: { label: "Movie", emoji: "🎬", color: "var(--movie)", glyph: "🎬" },
  music: { label: "Music", emoji: "🎵", color: "var(--music)", glyph: "🎵" },
  icon: { label: "Icon", emoji: "⭐", color: "var(--icon)", glyph: "⭐" },
};

export const EDITION_META = {
  Global: { flag: "🌍", label: "Global" },
  India: { flag: "🇮🇳", label: "India" },
} as const;

export function formatCountdown(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
