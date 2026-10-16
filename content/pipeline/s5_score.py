import pandas as pd, numpy as np, re, math
BANK = "/home/user/culturdle/content/Culturdle_Question_Bank_v1_full.xlsx"
STREAM = ["netflix","amazon","prime video","hotstar","disney+","zee5","sonyliv","jiocinema","voot","mx player","apple tv","hulu","hbo max","peacock","paramount+","altbalaji","eros now","streampix","ivi.ru"]
def lin(x, lo, hi):
    if x is None or (isinstance(x, float) and math.isnan(x)): return 0.0
    return float(min(1, max(0, (x - lo) / (hi - lo))))
def loglin(x, lo, hi):
    if not x or x <= 0: return 0.0
    return lin(math.log10(x), math.log10(lo), math.log10(hi))
names = pd.read_csv("names_wd.csv"); NL = dict(zip(names.name, names.links))
def fame(s, split=True):
    if not isinstance(s, str): return 0
    parts = [s.strip()] + (re.split(r"\s*(?:,|&| and | feat\.? | featuring | x | with | - )\s*", s) if split else [])
    return max([NL.get(p.strip(), 0) for p in parts if p.strip()] + [0])
def era(y, table):
    if not y or math.isnan(y): return table[-1][1]
    for start, v in table:
        if y >= start: return v
    return table[-1][1]

THEATRICAL = {"Goodbye", "Ram Setu", "Ala Vaikunthapurramuloo", "Major", "Miss Shetty Mr Polishetty"}  # cinema releases Wikidata only lists OTT for
out = []
# ---------- Movies
mv = pd.read_excel(BANK, "Movies")
imdb = pd.read_csv("movies_imdb.csv"); wd = pd.read_csv("movies_wd.csv")
m = mv.merge(imdb, on="ID", how="left").merge(wd, on="tconst", how="left")
for _, r in m.iterrows():
    g = r.Edition == "Global"
    dist = [d.strip().lower() for d in str(r.distributors).split("|") if d.strip() and str(r.distributors) != "nan"]
    streaming_only = bool(dist) and all(any(s in d for s in STREAM) for d in dist) and pd.notna(r.Year) and r.Year >= (2016 if g else 2020) and r.Answer not in THEATRICAL  # older films list later streaming rights
    c = {
        "Audience reach (IMDb votes)": loglin(r.votes, *( (20_000, 1_000_000) if g else (1_500, 80_000) )),
        "Wikipedia reach (languages)": lin(r.wd_links, *((8, 60) if g else (4, 30))),
        "Star power (lead's fame)": lin(fame(r.Lead), *((15, 110) if g else (8, 70))),
        "Audience rating (IMDb)": lin(r.imdb_rating, 5.0, 8.0),
        "Era familiarity": era(r.Year, [(1990, 1), (1975, .8), (1960, .6), (0, .4)]),
    }
    w = [0.40, 0.25, 0.15, 0.10, 0.10]
    excl = None
    if isinstance(r.titleType, str) and r.titleType != "movie": excl = f"Not a theatrical feature (IMDb type: {r.titleType})"
    elif streaming_only: excl = "Streaming premiere, not a theatrical release"
    if r.Source.startswith("Curated") and (not r.votes or r.votes == 0):  # recent curated hits with no IMDb match
        c["Audience reach (IMDb votes)"] = 0.7
    out.append({"sheet": "Movies", "ID": r.ID, "Edition": r.Edition, "pool": f"{r.Edition} · Movie", "comp": c, "w": w, "excl": excl,
                "signals": f"IMDb {int(r.votes or 0):,} votes · {r.imdb_rating if pd.notna(r.imdb_rating) else '–'}/10 · {int(r.wd_links) if pd.notna(r.wd_links) else 0} Wikipedias · lead fame {fame(r.Lead)}"})
# ---------- Music
mu = pd.read_excel(BANK, "Music"); sf = pd.read_csv("songs_film.csv"); mu = mu.merge(sf, on="ID", how="left")
for _, r in mu.iterrows():
    g = r.Edition == "Global"; t = r["Answer type"]
    if g and t == "Song":
        h2 = str(r["Hint 2 (after miss 1)"]); pk = re.search(r"#(\d+)", h2); wk = re.search(r"(\d+) weeks", h2)
        peak = int(pk.group(1)) if pk else 10; weeks = int(wk.group(1)) if wk else 10
        c = {"Chart peak (Hot 100)": lin(11 - peak, 1, 10), "Chart longevity (weeks)": lin(weeks, 10, 40),
             "Artist fame": lin(fame(r.Artist), 15, 110), "Era familiarity": era(r.Year, [(1980, 1), (1970, .75), (1960, .5), (0, .35)])}
        w = [0.30, 0.20, 0.30, 0.20]; sig = f"peak #{peak} · {weeks} weeks · artist fame {fame(r.Artist)}"
    elif g:
        h2 = str(r["Hint 2 (after miss 1)"]); t10 = re.search(r"(\d+) top-10", h2)
        c = {"Artist fame": lin(fame(r.Answer, False), 20, 130), "Hit count (top 10s)": lin(int(t10.group(1)) if t10 else 1, 1, 10),
             "Era familiarity": era(r.Year, [(1980, 1), (1970, .75), (1960, .5), (0, .35)])}
        w = [0.55, 0.30, 0.15]; sig = f"fame {fame(r.Answer, False)} · {t10.group(1) if t10 else '?'} top-10s"
    elif t == "Song":
        rt = re.search(r"rating ([\d.]+)/5", str(r["Reveal-card fact"])); rating = float(rt.group(1)) if rt else 4.0
        comp = str(r["Hint 4 (after miss 3)"]).split(":", 1)[-1]
        c = {"Film fame (IMDb votes)": loglin(r.film_votes, 500, 60_000), "Singer fame": lin(fame(r.Artist), 8, 60),
             "Composer fame": lin(fame(comp), 8, 50), "Listener rating": lin(rating, 3.8, 5.0),
             "Era familiarity": era(r.Year, [(1990, 1), (1970, .85), (1955, .65), (0, .35)])}
        w = [0.35, 0.20, 0.15, 0.15, 0.15]; sig = f"film votes {int(r.film_votes or 0):,} · singer {fame(r.Artist)} · composer {fame(comp)} · {rating}/5"
    else:
        n = re.search(r": (\d+)", str(r["Reveal-card fact"]))
        c = {"Artist fame": lin(fame(r.Answer, False), 8, 60), "Body of work (rated songs)": lin(int(n.group(1)) if n else 5, 5, 60)}
        w = [0.7, 0.3]; sig = f"fame {fame(r.Answer, False)} · {n.group(1) if n else '?'} rated songs"
    out.append({"sheet": "Music", "ID": r.ID, "Edition": r.Edition, "pool": f"{r.Edition} · Music", "comp": c, "w": w, "excl": None, "signals": sig})
# ---------- Icons
ic = pd.read_excel(BANK, "Icons")
for _, r in ic.iterrows():
    g = r.Edition == "Global"; f = fame(r.Answer, False); cur = str(r.Source).startswith("Curated")
    n = re.search(r"(\d+) films", str(r["Reveal-card fact"]))
    c = {"Wikipedia reach (languages)": lin(f, *((20, 140) if g else (8, 70))),
         "Editorial pick (curated)": 1.0 if cur else 0.35,
         "Screen presence (films in bank)": 1.0 if cur else lin(int(n.group(1)) if n else 3, 3, 20)}
    w = [0.65, 0.20, 0.15]
    out.append({"sheet": "Icons", "ID": r.ID, "Edition": r.Edition, "pool": f"{r.Edition} · Icon", "comp": c, "w": w, "excl": None, "signals": f"{f} Wikipedias"})
for o in out:
    o["score"] = round(10 * sum(v * w for v, w in zip(o["comp"].values(), o["w"])), 1)
df = pd.DataFrame(out); df.to_pickle("scored.pkl")
for cut in [5.0, 5.5, 6.0, 6.5]:
    k = df[(df.score >= cut) & df.excl.isna()]
    print(f"cut {cut}: keep {len(k)}/{len(df)} = {len(k)/len(df):.0%}  ", (k.groupby("pool").size() / df.groupby("pool").size()).round(2).to_dict())
print("excluded:", df.excl.value_counts().to_dict())
print(df.groupby("pool").score.describe().round(1))
