"use client";

import { store } from "./api";

export type Theme = "system" | "light" | "dark";

/** Inline script run before paint: applies theme, high contrast and reduced motion. */
export const PREFS_SCRIPT = `try{var t=localStorage.getItem('cd_theme')||'system';if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var d=document.documentElement;d.dataset.theme=t;if(localStorage.getItem('cd_hc')==='1')d.dataset.contrast='high';if(localStorage.getItem('cd_motion')==='reduced')d.dataset.motion='reduced'}catch(e){}`;

export function applyTheme(theme: Theme) {
  store.set("cd_theme", theme);
  const resolved = theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolved;
}

export function applyHighContrast(on: boolean) {
  store.set("cd_hc", on ? "1" : "0");
  if (on) document.documentElement.dataset.contrast = "high";
  else delete document.documentElement.dataset.contrast;
}

export function applyReducedMotion(on: boolean) {
  store.set("cd_motion", on ? "reduced" : "");
  if (on) document.documentElement.dataset.motion = "reduced";
  else delete document.documentElement.dataset.motion;
}

export const isHighContrast = () => store.get("cd_hc") === "1";

/** Share text in high-contrast mode uses 🟧 and 🟦 instead of 🟩 and 🟨. */
export function shareForDisplay(text: string): string {
  return isHighContrast() ? text.replace(/🟩/g, "🟧").replace(/🟨/g, "🟦") : text;
}
