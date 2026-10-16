import { ImageResponse } from "next/og";
import { MAX_GUESSES, MODES, pipsFor, type Mode, type Pip } from "@culturdle/core";
import { assertEdition, shareFor } from "@/lib/game";
import { handler, HttpError } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { SITE_DOMAIN } from "@/lib/config";

export const dynamic = "force-dynamic";

const TILE: Record<Pip, string> = { miss: "#787C7E", skip: "#FFFFFF", win: "#6AAA64", options: "#C9B458", lost: "#787C7E" };
const NAME: Record<Mode, string> = { movie: "Movie", music: "Music", icon: "Icon" };
const WORD = "CULTURDLE".split("");
const WORD_COLORS = ["#6AAA64", "#C9B458", "#787C7E", "#6AAA64", "#C9B458", "#6AAA64", "#787C7E", "#6AAA64", "#C9B458"];

/** Share card: 1080 × 1350 (feed) or 1080 × 1920 with ?story=1. Same spoiler-free grid as the text. */
export const GET = handler(async (req: Request, ctx: { params: Promise<{ date: string; edition: string }> }) => {
  const { date, edition: e } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "bad_date");
  const story = new URL(req.url).searchParams.get("story") === "1";
  const edition = assertEdition(e);
  const s = await shareFor(await requirePlayer(), date, edition);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FFFFFF", color: "#1A1A1B", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {WORD.map((l, i) => (
            <div key={i} style={{ width: 84, height: 84, borderRadius: 6, background: WORD_COLORS[i], color: WORD_COLORS[i] === "#787C7E" ? "#FFFFFF" : "#1A1A1B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 800 }}>{l}</div>
          ))}
        </div>
        <div style={{ fontSize: 44, color: "#6E7174", marginTop: 36 }}>{`No. ${s.puzzleNumber} · ${edition} edition`}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: story ? 120 : 80 }}>
          {MODES.map((m) => {
            const st = s.states[m];
            const pips = st ? pipsFor(st) : [];
            const score = !st || !st.guesses.length ? "—" : !st.finished ? "…" : st.solved ? `${st.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
            return (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ width: 170, fontSize: 40, fontWeight: 700 }}>{NAME[m]}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                    <div key={i} style={{ width: 92, height: 92, borderRadius: 6, background: pips[i] ? TILE[pips[i]] : "#FFFFFF", border: !pips[i] || pips[i] === "skip" ? "4px solid #D3D6DA" : "none" }} />
                  ))}
                </div>
                <div style={{ width: 120, fontSize: 44, fontWeight: 800, display: "flex", justifyContent: "flex-end" }}>{score}</div>
              </div>
            );
          })}
        </div>
        {s.streak > 0 ? <div style={{ fontSize: 44, marginTop: 90, fontWeight: 700 }}>{`${s.streak}-day streak`}</div> : null}
        <div style={{ fontSize: 38, marginTop: 50, color: "#6E7174" }}>{SITE_DOMAIN}</div>
      </div>
    ),
    { width: 1080, height: story ? 1920 : 1350, headers: { "Cache-Control": "private, no-store" } },
  );
});
