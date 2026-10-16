"use client";

import { useState } from "react";
import type { Edition, Mode } from "@culturdle/core";
import { api } from "@/lib/client/api";
import { Sheet } from "./Sheet";
import { Button } from "./Button";

export function ReportSheet({ open, onClose, edition, mode, date }: { open: boolean; onClose: () => void; edition: Edition; mode: Mode; date?: string }) {
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const submit = async () => {
    setState("sending");
    try {
      await api("/api/report", { method: "POST", json: { edition, mode, date, message: msg } });
      setState("sent");
      setMsg("");
    } catch {
      setState("error");
    }
  };
  return (
    <Sheet open={open} onClose={() => { onClose(); setState("idle"); }} title="Report a problem">
      {state === "sent" ? (
        <p className="text-muted">Thanks. We read every report and fix answer cards quickly.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="t-label text-muted" htmlFor="report">What's wrong?</label>
          <textarea
            id="report"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
            placeholder="A wrong fact, a hint that gives it away, a missing alias…"
            className="w-full rounded-[8px] border-2 border-border bg-bg p-3 text-[16px] outline-none focus:border-border-strong"
          />
          {state === "error" && <p className="text-[15px] text-muted">Could not send. Try again.</p>}
          <Button full onClick={submit} disabled={msg.trim().length < 3 || state === "sending"}>Send report</Button>
        </div>
      )}
    </Sheet>
  );
}
