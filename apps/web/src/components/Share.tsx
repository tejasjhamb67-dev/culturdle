"use client";

import { Share2 } from "lucide-react";
import { trackClient } from "@/lib/client/api";
import { COPY } from "@/lib/client/copy";
import { shareForDisplay } from "@/lib/client/prefs";
import { Button } from "./Button";

/** Web Share API where supported, otherwise copy to clipboard and say "Copied" (Foodle §6). */
export async function shareText(raw: string, onCopied: (m: string) => void) {
  const text = shareForDisplay(raw);
  if (typeof navigator !== "undefined" && navigator.share && matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ text });
      trackClient("share", { channel: "native" });
      return;
    } catch {
      return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    trackClient("share", { channel: "clipboard" });
    onCopied(COPY.copied);
  } catch {
    onCopied("Could not copy");
  }
}

export function ShareButton({ text, onToast, label = "Share result", full = true, variant = "primary" }: { text: string; onToast: (m: string) => void; label?: string; full?: boolean; variant?: "primary" | "secondary" }) {
  return (
    <Button full={full} variant={variant} onClick={() => void shareText(text, onToast)}>
      <Share2 size={18} aria-hidden /> {label}
    </Button>
  );
}
