# Rebuild hint ladders so each step carries more information (target: 75-90% of players solve).
import re, json, unicodedata, math
import pandas as pd

STOP = set("""the and of a an in on to for with by at from is it me my you your we our i be are was this that aur ka ki ke hai ho se mein na ne tu tum main hum
all not but or one she her his him they yeh ye love man new day big jr sr mr dr ii iii no""".split())

def norm(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    s = s.replace("&", " and ").replace("'", "").replace("’", "")
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return re.sub(r"^(the|a|an) ", "", s)

def answer_words(a):
    return {w for w in norm(a).split() if len(w) >= 3 and w not in STOP}

def mask(text, answer):
    """Replace any word of the answer with ____ (same rule the importer checks)."""
    words = answer_words(answer)
    if not words or not isinstance(text, str):
        return text
    def sub(m):
        tok = m.group(0)
        return "____" if norm(tok) in words else tok
    return re.sub(r"[A-Za-z0-9À-ɏ'’]+", sub, text)

def clean(s):
    return None if s is None or (isinstance(s, float) and math.isnan(s)) or str(s).strip() in ("", "nan") else str(s).strip()

def initials_shape(title):
    """'Title initials: D. W. A. B. D. O. (6 words)' — informative but not the answer."""
    t = re.sub(r"\(.*?\)", " ", str(title)).strip() or str(title)
    words = [w for w in re.split(r"\s+", re.sub(r"[^\w\s'’-]", " ", t)) if w]
    if len(words) == 1:
        w = words[0]
        return f"Title: one word, {len(w)} letters, starts with '{w[0].upper()}'"
    return f"Title initials: {' '.join(w[0].upper() + '.' for w in words)} ({len(words)} words)"

def name_shape(name):
    words = str(name).split()
    if len(words) == 1:
        return f"Name: one word, {len(words[0])} letters, starts with '{words[0][0].upper()}'"
    return f"Name: {len(words)} words — {' + '.join(str(len(w)) for w in words)} letters, initials {'.'.join(w[0].upper() for w in words)}."

def after(h, label=None):
    """Value part of 'Label: value'."""
    if not isinstance(h, str):
        return None
    return h.split(":", 1)[1].strip() if ":" in h else h.strip()

def label_of(h):
    return h.split(":", 1)[0].strip() if isinstance(h, str) and ":" in h else ""

# ---------------- Movies
def movie_hints(r, genres, costars):
    year = int(r.Year) if pd.notna(r.Year) else None
    g = ", ".join(genres[:2]) if genres else (after(r["Hint 1 (shown at start)"]) or "").split("·")[0].strip()
    h1 = f"Genre: {g} · {r.Industry} · released {year}" if year else f"Genre: {g} · {r.Industry}"
    h2 = f"Directed by: {r.Director}" if clean(r.Director) else r["Hint 4 (after miss 3)"]
    h3 = r["Hint 3 (after miss 2)"]
    cs = [c for c in costars if c and clean(r.Lead) and c.strip().lower() != str(r.Lead).strip().lower()][:2]
    if not cs:
        cs = [after(r["Hint 5 (after miss 4)"])] if after(r["Hint 5 (after miss 4)"]) else []
    h4 = f"Co-stars: {', '.join(cs)}" if cs else r["Hint 2 (after miss 1)"]
    music = clean(r.Music)
    lead = clean(r.Lead)
    if lead:
        h5 = f"Lead: {lead}" + (f" · music by {music}" if music and "no original score" not in music.lower() else "")
    else:
        h5 = f"Music by: {music}" if music else r["Hint 5 (after miss 4)"]
    h6 = initials_shape(r.Answer)
    return [h1, h2, h3, h4, h5, h6]

# ---------------- Music
def song_global_hints(r, other_hit):
    year = int(r.Year) if pd.notna(r.Year) else None
    genre = (after(r["Hint 1 (shown at start)"]) or "").split("·")[0].strip()
    h2o = str(r["Hint 2 (after miss 1)"])
    pk = re.search(r"#(\d+)", h2o); wk = re.search(r"(\d+) weeks", h2o)
    h1 = f"Vibe: {genre} · {year}" if year else f"Vibe: {genre}"
    h2 = f"Chart: peaked at #{pk.group(1) if pk else '?'} on the Billboard Hot 100" + (f", {wk.group(1)} weeks on the chart" if wk else "")
    hs = [r["Hint 3 (after miss 2)"], r["Hint 4 (after miss 3)"]]
    album = next((h for h in hs if label_of(h).startswith("Album")), None)
    other = next((h for h in hs if label_of(h).startswith("Same artist")), None)
    if not other and other_hit:
        other = f"Same artist also charted with: '{other_hit}'"
    cands = [c for c in [album, other, f"Chart year: entered the Hot 100 in {year}" if year else None] if c]
    while len(cands) < 2:
        cands.append(f"Artist initials: {'.'.join(w[0].upper() for w in str(r.Artist).split())}.")
    h5 = f"Artist: {r.Artist}"
    return [h1, h2, cands[0], cands[1], h5, initials_shape(r.Answer)]

def artist_global_hints(r, biggest):
    h = [r[c] for c in HINT_COLS]
    h5 = f"Biggest hit: '{biggest}'" if biggest else h[4]
    return [h[0], h[1], h[2], h[3], h5, name_shape(r.Answer)]

def song_india_hints(r, film, other_song):
    year = int(r.Year) if pd.notna(r.Year) else None
    v = (after(r["Hint 1 (shown at start)"]) or "").split("·")
    kind = v[0].strip() if v else "Hindi film song"
    label = v[2].strip() if len(v) > 2 else None
    h1 = f"Vibe: {kind} · {year}" + (f" · {label}" if label else "") if year else r["Hint 1 (shown at start)"]
    singers = after(r["Hint 3 (after miss 2)"]) or r.Artist
    h2 = f"Sung by: {singers}"
    comp = after(r["Hint 4 (after miss 3)"]); lyr = after(r["Hint 2 (after miss 1)"])
    h3 = f"Composed by: {comp}" + (f" · lyrics: {lyr}" if lyr and label_of(r['Hint 2 (after miss 1)']).startswith("Lyrics") else "")
    h5o = r["Hint 5 (after miss 4)"]
    if isinstance(h5o, str) and h5o.startswith("On screen"):
        h4 = h5o
    elif other_song:
        h4 = f"Same film also has: '{other_song}'"
    else:
        h4 = f"Lyrics by: {lyr}" if lyr else h5o
    h5 = f"From the film: {film}" + (f" ({year})" if year else "") if film and "non-film" not in str(film).lower() else (f"From the album: {film}" if film else r["Hint 6 (after miss 5, with options)"])
    h6 = initials_shape(r.Answer)
    return [h1, h2, h3, h4, h5, h6]

def artist_india_hints(r):
    h = [r[c] for c in HINT_COLS]
    return [h[0], h[1], h[2], h[3], h[4], name_shape(r.Answer)]

# ---------------- Icons
def icon_hints(r):
    h = [r[c] for c in HINT_COLS]
    lab = {label_of(x).lower(): x for x in h}
    shape = name_shape(r.Answer)
    if str(r.Source).startswith("Derived"):
        # Field, worked most with director, co-star, early film, big film, initials
        return [h[0], h[4], h[3], h[2], f"{h[1]} · initials {after(h[5])}", shape]
    if r["Answer type"] == "Brand":
        origin = after(h[0]); industry = after(h[1])
        return [f"Industry: {industry} · {origin}", h[3], h[2], h[4], h[5], shape]
    # curated person / band: Era, Field, Moment, Known for, Connection, Initials
    era = after(h[0]); field = after(h[1])
    return [f"Field: {field} · {era}", h[2], h[3], h[4], h[5], shape]

HINT_COLS = ["Hint 1 (shown at start)", "Hint 2 (after miss 1)", "Hint 3 (after miss 2)", "Hint 4 (after miss 3)", "Hint 5 (after miss 4)", "Hint 6 (after miss 5, with options)"]
