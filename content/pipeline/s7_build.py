# Build the trimmed, scored workbook with richer hints.
import json, re, math
import pandas as pd, numpy as np
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from s6_hints import *

BANK = "/home/user/culturdle/content/Culturdle_Question_Bank_v1_full.xlsx"
OUT = "/home/user/culturdle/content/Culturdle_Question_Bank.xlsx"
SRC = "../sources"
KEEP = {"Global · Movie": 0.75, "India · Movie": 0.55, "Global · Music": 0.60, "India · Music": 0.60, "Global · Icon": 0.80, "India · Icon": 0.80}
DIFF = [("Easy", 0.45), ("Medium", 0.35), ("Hard", 0.20)]
CUT = 6.0

sc = pd.read_pickle("scored.pkl")
sc["composite"] = sc.score / 10

# ---- calibrate: per pool, the composite at the keep quantile maps to 6.0
sc["final"] = np.nan; sc["reason"] = None
for pool, grp in sc.groupby("pool"):
    ok = grp[grp.excl.isna()]
    q = ok.composite.quantile(min(1, max(0, 1 - KEEP[pool] * len(grp) / len(ok)))) if len(ok) else 0
    cmax = ok.composite.max()
    def f(c):
        if c >= q: return CUT + (10 - CUT) * (c - q) / (cmax - q) if cmax > q else 10.0
        return CUT * c / q if q > 0 else 0.0
    sc.loc[grp.index, "final"] = grp.composite.map(f).round(1)
    sc.loc[grp.index, "cut_composite"] = q
# editorial rescue: canonical names whose Wikipedia footprint undersells them
RESCUE = {"Ramesh Sippy", "Bimal Roy", "Priyadarshan", "Vishal Bhardwaj", "Guru Dutt", "Hrishikesh Mukherjee", "Raj Kapoor", "Yash Chopra", "Satyajit Ray", "Mani Ratnam", "Anurag Kashyap", "Karan Johar", "Sanjay Leela Bhansali", "Rajkumar Hirani", "Zoya Akhtar", "Imtiaz Ali"}
ans_all = {}
for s_ in ["Movies", "Music", "Icons"]:
    d_ = pd.read_excel(BANK, s_); ans_all.update(dict(zip(d_.ID, d_.Answer)))
resc = sc.ID.map(ans_all).isin(RESCUE) & sc.excl.isna() & (sc.final < CUT)
print("rescued:", sorted(sc[resc].ID.map(ans_all)))
sc.loc[resc, "final"] = CUT
sc.loc[resc, "signals"] = sc.loc[resc, "signals"] + " · editorial rescue (canonical filmmaker)"
sc.loc[sc.excl.notna(), "reason"] = sc.excl
low = sc.excl.isna() & (sc.final < CUT)
def weakest(row):
    comp = row["comp"]; w = row["w"]
    k = min(comp, key=lambda n: comp[n] * w[list(comp).index(n)] / w[list(comp).index(n)])
    return f"Fame score {row['final']:.1f} < {CUT:.0f} — weakest signal: {k.lower()}"
sc.loc[low, "reason"] = sc[low].apply(weakest, axis=1)
sc["keep"] = sc.reason.isna()

# ---- lookups for hints
imdb = pd.read_csv("movies_imdb.csv").set_index("ID")
casts = json.load(open("wiki_casts.json"))
sfilm = pd.read_csv("songs_film.csv").set_index("ID")
bb = pd.read_csv(f"{SRC}/rwd-billboard-data/data-out/hot-100-current.csv", usecols=["title", "performer", "peak_pos", "wks_on_chart"])
bb = bb.groupby(["title", "performer"]).agg(peak=("peak_pos", "min"), weeks=("wks_on_chart", "max")).reset_index()
def hits_by(artist, exclude=None):
    a = str(artist).lower()
    m = bb[bb.performer.str.lower().str.contains(re.escape(a), na=False)].sort_values(["peak", "weeks"], ascending=[True, False])
    m = m[m.title.str.lower() != str(exclude).lower()] if exclude else m
    return [re.sub(r"\s*\((?:From|from)[^)]*\)", "", t).replace('"', "").strip() for t in m.title.tolist()]

def norm_t(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\(\d{4}\)", "", s).replace("&", " and ")
    return re.sub(r"^(the|a|an) ", "", re.sub(r"[^a-z0-9]+", " ", s).strip())

sheets = {s: pd.read_excel(BANK, s) for s in ["Movies", "Music", "Icons"]}
mu_all = sheets["Music"]
film_songs = {}
for _, r in mu_all[(mu_all.Edition == "India") & (mu_all["Answer type"] == "Song")].iterrows():
    if r.ID in sfilm.index:
        film_songs.setdefault(sfilm.loc[r.ID, "film"], []).append(r.ID)
keep_ids = set(sc[sc.keep].ID)
ans = dict(zip(mu_all.ID, mu_all.Answer))

kept, removed = {}, []
scmap = sc.set_index("ID")
for name, df in sheets.items():
    rows = []
    for _, r in df.iterrows():
        s = scmap.loc[r.ID]
        if not s.keep:
            removed.append({"ID": r.ID, "Sheet": name, "Edition": r.Edition, "Answer": r.Answer,
                            "Year": r.get("Year") if name != "Icons" else None, "Fame score": s.final, "Reason": s.reason, "Signals": s.signals})
            continue
        if name == "Movies":
            g = str(imdb.loc[r.ID, "imdb_genres"]).split(",") if r.ID in imdb.index and pd.notna(imdb.loc[r.ID, "imdb_genres"]) else []
            cl = imdb.loc[r.ID, "cast_list"] if r.ID in imdb.index else None
            if isinstance(cl, str):
                costars = [c.strip() for c in cl.split(",")]
            else:
                costars = casts.get(f"{norm_t(r.Answer)}|{int(r.Year) if pd.notna(r.Year) else ''}", [])
            hints = movie_hints(r, [x for x in g if x and x != "\\N"], costars)
        elif name == "Music":
            if r.Edition == "Global" and r["Answer type"] == "Song":
                others = hits_by(r.Artist, r.Answer)
                hints = song_global_hints(r, others[0] if others else None)
            elif r.Edition == "Global":
                top = hits_by(r.Answer)
                hints = artist_global_hints(r, top[0] if top else None)
            elif r["Answer type"] == "Song":
                film = sfilm.loc[r.ID, "film"] if r.ID in sfilm.index else None
                sib = [ans[i] for i in film_songs.get(film, []) if i != r.ID and i in keep_ids]
                hints = song_india_hints(r, film, sib[0] if sib else None)
            else:
                hints = artist_india_hints(r)
        else:
            hints = icon_hints(r)
        hints = [mask(h, r.Answer) for h in hints]
        bad = len([h for h in hints if clean(h)]) < 6 or any(answer_words(r.Answer) & set(norm(h).split()) for h in hints if isinstance(h, str))
        if bad:
            removed.append({"ID": r.ID, "Sheet": name, "Edition": r.Edition, "Answer": r.Answer, "Year": r.get("Year") if name != "Icons" else None,
                            "Fame score": s.final, "Reason": "Hint ladder could not be rebuilt cleanly", "Signals": s.signals})
            continue
        r = r.copy()
        for c, h in zip(HINT_COLS, hints): r[c] = h
        r["Fame score (0-10)"] = s.final
        r["Score signals"] = s.signals
        r["Verify flag"] = "; ".join(x for x in [clean(r.get("Verify flag")), "Hints rebuilt Oct 2026 for a 75–90% solve target"] if x)
        rows.append(r)
    k = pd.DataFrame(rows)
    # same answer twice in an edition can't be a fair puzzle — keep the more famous copy
    k["_key"] = k.Edition + "|" + k.Answer.map(norm)
    k = k.sort_values("Fame score (0-10)", ascending=False)
    dup = k[k.duplicated("_key")]
    for _, r in dup.iterrows():
        twin = k[(k._key == r._key)].iloc[0].ID
        removed.append({"ID": r.ID, "Sheet": name, "Edition": r.Edition, "Answer": r.Answer, "Year": r.get("Year") if name != "Icons" else None,
                        "Fame score": r["Fame score (0-10)"], "Reason": f"Duplicate answer — better-known copy kept ({twin})", "Signals": r["Score signals"]})
    k = k[~k.duplicated("_key")].drop(columns="_key").sort_index()
    # difficulty from fame score within each edition (+ answer group for music)
    for ed, grp in k.groupby("Edition"):
        order = grp.sort_values("Fame score (0-10)", ascending=False).index
        n = len(order); a = int(round(n * DIFF[0][1])); b = a + int(round(n * DIFF[1][1]))
        k.loc[order[:a], "Difficulty"] = "Easy"; k.loc[order[a:b], "Difficulty"] = "Medium"; k.loc[order[b:], "Difficulty"] = "Hard"
    kept[name] = k
rem = pd.DataFrame(removed)
json.dump({"kept": {n: len(d) for n, d in kept.items()}, "removed": len(rem)}, open("summary.json", "w"))
pd.to_pickle((kept, rem, sc), "build.pkl")
print({n: len(d) for n, d in kept.items()}, "removed", len(rem))
print(rem.Reason.str.split(" — ").str[0].str.replace(r"Fame score [\d.]+ < 6", "Below 6", regex=True).value_counts())
