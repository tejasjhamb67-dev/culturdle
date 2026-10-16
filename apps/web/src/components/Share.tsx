"use client";

import { useState } from "react";
import { trackClient } from "@/lib/client/api";
import { Sheet } from "./Sheet";

export function ShareButton({ text, imageUrl, className, label = "Share" }: { text: string; imageUrl?: string; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackClient("share", { channel: "copy" });
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  const native = async () => {
    try {
      await navigator.share({ text });
      trackClient("share", { channel: "native" });
    } catch {}
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={className ?? "tap rounded-full bg-win px-6 py-3 font-semibold text-white"}>
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Share your result">
        <pre className="mb-4 whitespace-pre-wrap rounded-2xl border border-line bg-bg p-4 font-sans text-[15px] leading-relaxed">{text}</pre>
        <div className="grid grid-cols-2 gap-2">
          <a
            className="tap flex items-center justify-center rounded-2xl bg-[#25D366] px-3 py-3 font-semibold text-black"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackClient("share", { channel: "whatsapp" })}
          >
            WhatsApp
          </a>
          <a
            className="tap flex items-center justify-center rounded-2xl bg-text px-3 py-3 font-semibold text-bg"
            href={`https://x.com/intent/post?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackClient("share", { channel: "x" })}
          >
            Post on X
          </a>
          <button onClick={copy} className="tap rounded-2xl border border-line bg-surface-2 px-3 py-3 font-semibold">
            {copied ? "Copied ✓" : "Copy text"}
          </button>
          {typeof navigator !== "undefined" && "share" in navigator ? (
            <button onClick={native} className="tap rounded-2xl border border-line bg-surface-2 px-3 py-3 font-semibold">More…</button>
          ) : (
            <span />
          )}
          {imageUrl && (
            <a
              href={imageUrl}
              download="culturdle-story.png"
              className="tap col-span-2 flex items-center justify-center rounded-2xl bg-gradient-to-r from-movie via-music to-icon px-3 py-3 font-semibold text-white"
              onClick={() => trackClient("share", { channel: "story" })}
            >
              Save Story image (1080×1920)
            </a>
          )}
        </div>
      </Sheet>
    </>
  );
}
