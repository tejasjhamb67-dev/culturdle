import { ImageResponse } from "next/og";
import { MAX_GUESSES, MODES, pipsFor, type Mode, type Pip } from "@culturdle/core";
import { assertEdition, shareFor } from "@/lib/game";
import { handler, HttpError } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { SITE_DOMAIN } from "@/lib/config";

export const dynamic = "force-dynamic";

const PIP_COLOR: Record<Pip, string> = { miss: "#E5484D", skip: "#3A3F4B", win: "#30A46C", options: "#F5D90A", lost: "#11141A" };
const MODE_COLOR: Record<Mode, string> = { movie: "#E5484D", music: "#8E4EC6", icon: "#F5B83D" };
const MODE_NAME: Record<Mode, string> = { movie: "MOVIE", music: "MUSIC", icon: "ICON" };

/** 1080×1920 Instagram Story image of the same spoiler-free grid. */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ date: string; edition: string }> }) => {
  const { date, edition: e } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "bad_date");
  const edition = assertEdition(e);
  const s = await shareFor(await requirePlayer(), date, edition);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#0E1116 0%,#1b1420 60%,#0E1116 100%)", color: "#F4F1EA", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", gap: 18, marginBottom: 40 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ width: 22, height: 22, borderRadius: 11, background: "#F5B83D", opacity: i % 2 ? 0.55 : 1 }} />
          ))}
        </div>
        <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: 12 }}>CULTURDLE</div>
        <div style={{ fontSize: 56, color: "#8A90A0", marginTop: 10 }}>{`#${s.puzzleNumber} · ${edition} edition`}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 44, marginTop: 110 }}>
          {MODES.map((m) => {
            const st = s.states[m];
            const pips = st ? pipsFor(st) : [];
            const score = !st || !st.guesses.length ? "—" : !st.finished ? "…" : st.solved ? `${st.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
            return (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 28, background: "#181C24", borderRadius: 36, padding: "34px 44px", borderLeft: `16px solid ${MODE_COLOR[m]}` }}>
                <div style={{ width: 210, fontSize: 52, fontWeight: 700, color: MODE_COLOR[m], letterSpacing: 4 }}>{MODE_NAME[m]}</div>
                <div style={{ display: "flex", gap: 16 }}>
                  {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                    <div key={i} style={{ width: 84, height: 84, borderRadius: 16, background: pips[i] ? PIP_COLOR[pips[i]] : "#232836", border: pips[i] === "lost" ? "4px solid #3A3F4B" : "none" }} />
                  ))}
                </div>
                <div style={{ width: 150, textAlign: "right", fontSize: 60, fontWeight: 800, display: "flex", justifyContent: "flex-end" }}>{score}</div>
              </div>
            );
          })}
        </div>
        {s.streak > 0 ? <div style={{ fontSize: 64, marginTop: 100, color: "#F5B83D", fontWeight: 700 }}>{`${s.streak}-day streak`}</div> : null}
        <div style={{ fontSize: 48, marginTop: 70, color: "#8A90A0" }}>{SITE_DOMAIN}</div>
      </div>
    ),
    { width: 1080, height: 1920, headers: { "Cache-Control": "private, no-store" } },
  );
});
