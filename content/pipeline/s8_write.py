import pandas as pd, numpy as np, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.comments import Comment

OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/user/culturdle/content/Culturdle_Question_Bank.xlsx"
kept, rem, sc = pd.read_pickle("build.pkl")
ORIG = "/home/user/culturdle/content/Culturdle_Question_Bank_v1_full.xlsx"
F = "Arial"
H = Font(name=F, bold=True, color="FFFFFF"); HF = PatternFill("solid", fgColor="1A1A1B")
B = Font(name=F); BB = Font(name=F, bold=True); T = Font(name=F, bold=True, size=16); M = Font(name=F, color="6E7174")
GREEN = PatternFill("solid", fgColor="E3F1E1"); YEL = PatternFill("solid", fgColor="F6F0D5")
wb = Workbook(); wb.remove(wb.active)

def table(ws, df, widths=None, start=1):
    for j, c in enumerate(df.columns, 1):
        x = ws.cell(row=start, column=j, value=c); x.font = H; x.fill = HF; x.alignment = Alignment(wrap_text=True, vertical="center")
    for i, row in enumerate(df.itertuples(index=False), start + 1):
        for j, v in enumerate(row, 1):
            if isinstance(v, float) and np.isnan(v): v = None
            if isinstance(v, (np.integer,)): v = int(v)
            if isinstance(v, (np.floating,)): v = float(v)
            ws.cell(row=i, column=j, value=v).font = B
    ws.freeze_panes = ws.cell(row=start + 1, column=1)
    ws.auto_filter.ref = f"A{start}:{get_column_letter(len(df.columns))}{start + len(df)}"
    for j, c in enumerate(df.columns, 1):
        ws.column_dimensions[get_column_letter(j)].width = (widths or {}).get(c, min(48, max(10, len(str(c)) + 2)))

POOLS = [("Movies", "Global"), ("Movies", "India"), ("Music", "Global"), ("Music", "India"), ("Icons", "Global"), ("Icons", "India")]
orig_counts = {(s, e): int(((sc.sheet == s) & (sc.Edition == e)).sum()) for s, e in POOLS}

# ---------- README
ws = wb.create_sheet("README")
ws["A1"] = "Culturdle — Question Bank v2 (trimmed and scored)"; ws["A1"].font = T
lines = [
    "Daily guessing game: two editions (Global, India) × three modes (Movie, Music, Icon). Six guesses; a new hint after every miss; four options on guess six.",
    "",
    "What changed from v1 (15,110 rows):",
    "• Scope narrowed to well-known, theatrically released films, charting songs and famous people and brands.",
    "• Every row has a Fame score from 0 to 10 built from public popularity signals (see the Scoring tab). Rows scoring below 6.0 were removed.",
    "• Streaming-premiere films and TV movies were removed regardless of score (theatrical releases only).",
    "• Hint ladders were rebuilt so each hint carries more information — the target is now 75–90% of players solving, not 45–55%.",
    "• Difficulty is re-derived from the Fame score within each edition: top 45% Easy, next 35% Medium, last 20% Hard.",
    "• Every removed row is listed on the Removed tab with its score and the reason, so any can be restored by hand.",
    "",
    "Hint ladders (v2):",
    "Movie: genre · industry · release year → director → plot moment (names masked) → two co-stars → lead actor · composer → title initials + options",
    "English song: genre · year → chart peak and weeks → album or another hit → another hit → artist → title initials + options",
    "Hindi song: year · label → singers → composer · lyricist → on-screen stars or a sister song → film name → title initials + options",
    "Artist: era and genre → chart record or partner → first hit or collaborator → landmark album or signature song → biggest hit → name shape + options",
    "Person / band: field · era → defining moment → known for → connection → initials → name shape + options",
    "Brand: industry · origin → iconic product → founders → tagline → logo described → name shape + options",
    "",
    "Any word of the answer inside a hint is masked as ____. The app's importer reads these tabs unchanged (extra columns are ignored).",
    "Still to do before launch: rewrite Movie “Moment” hints in original words (several are source synopsis text), and verify curated rows.",
]
for i, l in enumerate(lines, 3):
    ws.cell(row=i, column=1, value=l).font = BB if l.endswith(":") else B
ws.column_dimensions["A"].width = 150

# ---------- Scoring
ws = wb.create_sheet("Scoring")
ws["A1"] = "How the Fame score works"; ws["A1"].font = T
ws["A2"] = "Each signal is scaled 0–1 between its anchors, weighted and summed. Scores are then calibrated within each pool so that 6.0 is the keep line; anything below 6.0 is removed."; ws["A2"].font = M
spec = [
    ("Movie", "Audience reach", "IMDb vote count (log scale)", "40%", "Global 20k → 1M · India 1.5k → 80k"),
    ("Movie", "Wikipedia reach", "Number of Wikipedia language editions with an article (Wikidata sitelinks)", "25%", "Global 8 → 60 · India 4 → 30"),
    ("Movie", "Star power", "Lead actor's Wikipedia reach", "15%", "Global 15 → 110 · India 8 → 70"),
    ("Movie", "Audience rating", "IMDb rating", "10%", "5.0 → 8.0"),
    ("Movie", "Era familiarity", "Release year (newer = more familiar)", "10%", "≥1990: 1 · 1975–89: 0.8 · 1960–74: 0.6 · older 0.4"),
    ("Movie", "Exclusion", "Streaming premiere: every Wikidata distributor is a streaming service AND released 2016+ (Global) / 2020+ (India), since older films list later OTT rights; or IMDb type TV movie / video. Duplicate answers keep the better-known copy.", "removed", "theatrical releases only"),
    ("English song", "Chart peak", "Billboard Hot 100 peak position", "30%", "#10 → #1"),
    ("English song", "Chart longevity", "Weeks on the Hot 100", "20%", "10 → 40 weeks"),
    ("English song", "Artist fame", "Artist's Wikipedia reach", "30%", "15 → 110"),
    ("English song", "Era familiarity", "Chart year", "20%", "≥1980: 1 · 1970s 0.75 · 1960s 0.5 · older 0.35"),
    ("Hindi song", "Film fame", "IMDb votes for the song's film (log scale)", "35%", "500 → 60k"),
    ("Hindi song", "Singer fame", "Singer's Wikipedia reach", "20%", "8 → 60"),
    ("Hindi song", "Composer fame", "Composer's Wikipedia reach", "15%", "8 → 50"),
    ("Hindi song", "Listener rating", "Rating in the Bollywood songs dataset", "15%", "3.8 → 5.0"),
    ("Hindi song", "Era familiarity", "Release year", "15%", "≥1990: 1 · 1970–89 0.85 · 1955–69 0.65 · older 0.35"),
    ("Artist (music)", "Artist fame", "Wikipedia reach", "55–70%", "Global 20 → 130 · India 8 → 60"),
    ("Artist (music)", "Hit count / body of work", "Top-10 hits (Global) or highly rated songs (India)", "30%", "1 → 10 hits · 5 → 60 songs"),
    ("Icon", "Wikipedia reach", "Wikipedia language editions for the person, band or brand", "65%", "Global 20 → 140 · India 8 → 70"),
    ("Icon", "Editorial pick", "Hand-curated icon (vs. auto-derived from film credits)", "20%", "curated 1 · derived 0.35"),
    ("Icon", "Screen presence", "Films in the bank (derived actors only)", "15%", "3 → 20 films"),
]
for j, h in enumerate(["Category", "Signal", "Measured by", "Weight", "Anchors (0 → full marks)"], 1):
    c = ws.cell(row=4, column=j, value=h); c.font = H; c.fill = HF
for i, row in enumerate(spec, 5):
    for j, v in enumerate(row, 1): ws.cell(row=i, column=j, value=v).font = B
for j, w in enumerate([16, 26, 70, 10, 48], 1): ws.column_dimensions[get_column_letter(j)].width = w

r0 = 5 + len(spec) + 2
ws.cell(row=r0, column=1, value="Retention by pool").font = BB
hdr = ["Sheet", "Edition", "Rows in v1", "Kept (live count)", "Removed (live count)", "Retained %", "Keep target"]
for j, h in enumerate(hdr, 1):
    c = ws.cell(row=r0 + 1, column=j, value=h); c.font = H; c.fill = HF
targets = {("Movies", "Global"): 0.75, ("Movies", "India"): 0.55, ("Music", "Global"): 0.60, ("Music", "India"): 0.60, ("Icons", "Global"): 0.80, ("Icons", "India"): 0.80}
for i, (s, e) in enumerate(POOLS, r0 + 2):
    ws.cell(row=i, column=1, value=s).font = B; ws.cell(row=i, column=2, value=e).font = B
    c = ws.cell(row=i, column=3, value=orig_counts[(s, e)]); c.font = Font(name=F, color="0000FF")
    ws.cell(row=i, column=4, value=f'=COUNTIFS({s}!$B:$B,$B{i})').font = B
    ws.cell(row=i, column=5, value=f'=COUNTIFS(Removed!$B:$B,$A{i},Removed!$C:$C,$B{i})').font = B
    ws.cell(row=i, column=6, value=f"=IFERROR(D{i}/C{i},0)").font = B; ws.cell(row=i, column=6).number_format = "0.0%"
    c = ws.cell(row=i, column=7, value=targets[(s, e)]); c.font = Font(name=F, color="0000FF"); c.number_format = "0%"
tr = r0 + 2 + len(POOLS)
ws.cell(row=tr, column=1, value="Total").font = BB
for col in "CDE":
    ws[f"{col}{tr}"] = f"=SUM({col}{r0 + 2}:{col}{tr - 1})"; ws[f"{col}{tr}"].font = BB
ws[f"F{tr}"] = f"=IFERROR(D{tr}/C{tr},0)"; ws[f"F{tr}"].number_format = "0.0%"; ws[f"F{tr}"].font = BB
ws.cell(row=r0 + 1, column=3).comment = Comment("Source: v1 workbook row counts (16 Oct 2026).", "Culturdle")
ws.cell(row=tr + 2, column=1, value="Blue = fixed inputs (v1 counts and keep targets). Black = formulas over the Movies, Music, Icons and Removed tabs.").font = M

r1 = tr + 4
ws.cell(row=r1, column=1, value="Difficulty mix of kept rows").font = BB
for j, h in enumerate(["Sheet", "Edition", "Easy", "Medium", "Hard"], 1):
    c = ws.cell(row=r1 + 1, column=j, value=h); c.font = H; c.fill = HF
for i, (s, e) in enumerate(POOLS, r1 + 2):
    ws.cell(row=i, column=1, value=s).font = B; ws.cell(row=i, column=2, value=e).font = B
    dcol = "D" if s == "Movies" else ("D" if s == "Music" else "E")
    for j, d in enumerate(["Easy", "Medium", "Hard"], 3):
        ws.cell(row=i, column=j, value=f'=COUNTIFS({s}!$B:$B,$B{i},{s}!${dcol}:${dcol},"{d}")').font = B

# ---------- data sheets
for name in ["Movies", "Music", "Icons"]:
    ws = wb.create_sheet(name)
    df = kept[name].sort_values(["Edition", "Fame score (0-10)"], ascending=[True, False])
    widths = {c: 40 for c in df.columns if c.startswith("Hint") or c in ("Reveal-card fact", "Verify flag", "Score signals", "Source")}
    widths.update({"Answer": 32, "ID": 13, "Edition": 9, "Fame score (0-10)": 11, "Difficulty": 10})
    table(ws, df, widths)
    sc_col = list(df.columns).index("Fame score (0-10)") + 1
    for i in range(2, len(df) + 2):
        c = ws.cell(row=i, column=sc_col); c.fill = GREEN if (c.value or 0) >= 8 else YEL; c.number_format = "0.0"

ws = wb.create_sheet("Removed")
rm = rem.sort_values(["Sheet", "Edition", "Fame score"], ascending=[True, True, False])[["ID", "Sheet", "Edition", "Answer", "Year", "Fame score", "Reason", "Signals"]]
table(ws, rm, {"Answer": 34, "Reason": 70, "Signals": 60, "Fame score": 11})

ws = wb.create_sheet("Sources")
src = pd.read_excel(ORIG, "Sources")
extra = pd.DataFrame([
    {"Dataset": "IMDb non-commercial datasets (title.basics, title.ratings)", "Used for": "Film vote counts, ratings and title type (theatrical vs TV/video)", "Link": "https://datasets.imdbws.com/", "Licence / note": "Personal and non-commercial use; check terms before commercial launch"},
    {"Dataset": "Wikidata (sitelinks, distributors)", "Used for": "Wikipedia reach for films, people, bands and brands; streaming-premiere detection", "Link": "https://www.wikidata.org", "Licence / note": "CC0"},
    {"Dataset": "Wikipedia API", "Used for": "Resolving names to Wikidata items", "Link": "https://en.wikipedia.org/w/api.php", "Licence / note": "CC BY-SA (metadata only used)"},
])
table(ws, pd.concat([src, extra], ignore_index=True), {"Dataset": 50, "Used for": 60, "Link": 50, "Licence / note": 50})
wb.save(OUT)
print("saved", OUT)
