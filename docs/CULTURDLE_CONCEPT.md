# Culturdle — Concept Note

Version 2.0 · 16 October 2026 · Owner: TJ
Supersedes the 15 October concept note (scope narrowed to movies, music and icons).

---

## 1. One line

Culturdle is a daily pop-culture guessing game: six puzzles a day — a movie, a song or artist, and an icon, in a Global edition and an India edition — each solved in six guesses with a new hint after every miss.

## 2. Why this, why now

- Daily puzzle games are a proven habit. NYT Games puzzles were played 11.1 billion times in 2024; Wordle accounted for 5.3 billion of those plays (Wikipedia, citing The Verge).
- Wordle went from about 90 players to over 300,000 in roughly two months, largely through spoiler-free result sharing, and sold to NYT for a "low seven figures" (AFP, Jan 2022).
- Existing pop-culture "-dle" games each cover one narrow slice: one film still (Framed), one video game's characters (LoLdle), or one museum's artists (Artle). None combines Hollywood, Bollywood, English and Indian music, and global and Indian celebrities and brands in one daily ritual.
- India is a large, under-served audience for this format. Bollywood songs, cricket stars and Indian brands are shared cultural memory across generations.

## 3. Scope (what is in, what is out)

| In | Out (for now) |
|---|---|
| Movies: Hollywood and Bollywood (popular pan-India films to follow) | Telugu, Tamil and Malayalam films as puzzles — not yet in the bank; their stars appear inside Icons |
| Music: English songs and artists; Hindi film and non-film songs, singers and composers | Punjabi and South Indian songs — not yet in the bank; lyrics as hints (copyright) |
| Icons: actors, musicians, athletes, business leaders, scientists, creators, and brands (Nike, Adidas, Amul, Tata) | Art, festivals, heritage, mythology |
| Global and India editions | Kids mode, other regional editions |
| Text hints | Images (posters, photos, logos) — phase 2, licence permitting |

## 4. The daily format

Six puzzles a day, one per mode per edition. Every player can play all six.

| | Movie | Music | Icon |
|---|---|---|---|
| **Global** | Hollywood film | English song or artist (Billboard Hot 100 history) | Global person, band or brand |
| **India** | Bollywood film | Hindi song, singer or composer | Indian person or brand |

- Each puzzle can be played once a day.
- All puzzles reset together at 00:00 IST (18:30 UTC). Everyone in the world gets the same six puzzles.
- On first launch the player picks a home edition (Global or India). The home edition shows first; the other is one tap away.
- A puzzle takes about one to two minutes. All six take about ten.

## 5. How a puzzle plays

1. The puzzle opens with its type ("Guess the film", "Guess the song", "Guess the artist", "Guess the brand") and Hint 1.
2. The player types a guess. Autocomplete suggests names from the full answer list for that mode and edition, so typos never cost a guess and the list never reveals today's answer.
3. A wrong guess (or a skip) unlocks the next hint.
4. Guess 6 is the safety net: Hint 6 appears together with four answer options (the answer plus three plausible decoys). This is the only time options are shown.
5. Win or lose, a reveal card shows the answer and one fact.

### Hint ladders

Hints start ambiguous and get clearer, but even Hints 5 and 6 are nudges, not giveaways. The target is that about half of players solve each puzzle, so a solve feels earned and a miss brings players back tomorrow.

| Mode | Hint 1 | Hint 2 | Hint 3 | Hint 4 | Hint 5 | Hint 6 (+ options) |
|---|---|---|---|---|---|---|
| Movie | One genre · decade | Music composer | A plot moment, names masked | Director | One co-star | Lead actor's initials · year |
| Song (Global) | Genre · decade | Chart stats (peak, weeks) | Album | Another hit by the artist | Artist initials | Title shape (word count, first letter) |
| Song (India) | Film or non-film · decade · label | Lyricist | Singers | Composer | Film's director and stars | Film name shape · year |
| Artist / composer | Era and genre or role | Chart record or collaborator | First hit, or frequent composer/singer | Landmark album or signature song | Biggest-hit shape or famous soundtrack | Initials |
| Person | Decade born · nationality | Field | A defining moment | Known for | Connection (team, company, nickname) | Initials |
| Brand | Home country · decade founded | Industry | Founder(s) | Iconic product | Tagline | Logo, described in words |

Any word of the answer that would appear in a hint is masked as `____`.

### Weekly difficulty curve

All players get the same difficulty each day, which keeps leaderboards fair.

| Day | Difficulty |
|---|---|
| Monday, Tuesday, Wednesday | Easy |
| Thursday, Friday | Medium |
| Saturday | Hard |
| Sunday | "Cult Classic Sunday" — Easy or Medium, chosen from the most iconic entries |

## 6. Scoring, streaks and leaderboards

| Result | Points |
|---|---|
| Solved on guess 1 | 6 |
| Guess 2 | 5 |
| Guess 3 | 4 |
| Guess 4 | 3 |
| Guess 5 | 2 |
| Guess 6 (with options) | 1 |
| Not solved | 0 |

- Daily maximum: 18 points per edition, 36 for both.
- **Play streak:** play at least one puzzle a day. One puzzle is enough, so the streak never feels like a chore.
- **Perfect Day:** solve all three puzzles of an edition on the same day.
- **Streak freeze:** earn one for every seven-day streak; hold up to two. A freeze is used automatically on a missed day.
- **Leaderboards:**
  - Friends: the main view; weekly totals reset every Monday.
  - Global and India: daily and weekly.
  - Private groups: created with an invite link (office, family, college).

## 7. Why players come back

| Lever | How Culturdle uses it |
|---|---|
| Scarcity | Six puzzles, then a countdown. No unlimited play on the live day. |
| Shared moment | Everyone solves the same puzzles, so "did you get today's song?" works across a group. |
| Social proof | Spoiler-free emoji share block, optimised for WhatsApp and Instagram Stories. |
| Competition | Weekly friends league with Monday reset. Everyone starts level each week. |
| Loss aversion | Streaks and streak freezes. |
| The "aha" moment | Hints stay ambiguous until late, so a solve feels earned. Target: about half of players solve each puzzle. |
| Unfinished business | About half of players miss each day; the reveal card and tomorrow's countdown pull them back. Options on guess 6 keep a miss from feeling hopeless. |
| Variety | Three modes and two editions, with a weekly difficulty rhythm and Cult Classic Sunday. |
| Nostalgia | Answers span 1950s Bollywood to 2025 releases, so every age group gets "their" puzzles. |
| Collection | A "Shelf" of every answer solved, grouped by decade and mode. |

## 8. Content

The question bank is in `Culturdle_Question_Bank.xlsx`: 15,110 ready-to-schedule puzzles built mostly from open datasets.

| Sheet | Global | India | Total | Main sources |
|---|---|---|---|---|
| Movies | 2,161 | 2,124 | 4,285 | TMDB 5000; Wikipedia Movie Data; IMDb Bollywood 1951–2023; Bollywood Songs & Albums Metadata; 81 curated 2017–2025 Hollywood films |
| Music | 5,752 | 3,832 | 9,584 | Billboard Hot 100 1958–Oct 2026; Spotify genre data (TidyTuesday); Rolling Stone 500; Bollywood Songs & Albums Metadata 1931–2025 |
| Icons | 835 | 406 | 1,241 | Curated people and brands; actors and directors derived from the film data |
| **Total** | **8,748** | **6,362** | **15,110** | |

**Runway at one puzzle a day per pool:** Movies about 5.8 years; Music over 10 years; Icons Global about 2.3 years; Icons India about 1.1 years. India Icons is the first pool to need new content.

**Before launch:**

- All 733 curated icon and brand rows and 81 curated recent films need a manual check.
- Movie "Moment" hints currently reuse synopsis text from TMDB and IMDb and must be rewritten in original words.
- Difficulty labels come from the v2 fame score (top 45% Easy, next 35% Medium, last 20% Hard per edition) until real solve rates replace them.
- Scope (v2 bank): theatrical releases and well-known names only. Every row carries a 0–10 fame score; rows below 6 were cut. See the Scoring and Removed tabs of the workbook.

## 9. Business model

Freemium. All six daily puzzles are always free.

| Free | Culturdle+ (subscription) |
|---|---|
| Six daily puzzles, streaks, sharing, leaderboards, friends and groups | Full archive of past puzzles |
| One streak freeze per seven-day streak | Extra streak freezes |
| Light, non-intrusive ads after a puzzle ends | No ads |
| Basic stats | Detailed stats by decade and mode; full Shelf |

Later revenue options:

- Branded weeks (a studio's release, a label's catalogue), clearly labelled
- Brand puzzles, sold only as "featured", never as paid placement in normal play
- Licensed embeds for media sites

## 10. Platform

Built like Foodle:

- Expo (iOS and Android) plus Next.js (web)
- Shared backend and accounts with Foodle

Accounts are optional; signing in syncs streaks across devices and unlocks friends and leaderboards. The technical spec is in `CULTURDLE_DESIGN.md`.

## 11. Success metrics

| Metric | Definition |
|---|---|
| Daily active players | Played at least one puzzle |
| Puzzles per player per day | Out of six |
| D1 / D7 / D30 retention | Return on day 1, 7, 30 |
| Share rate | Shares per finished puzzle |
| Solve rate by puzzle | Solved within six guesses; target band 75–90% |
| Median guess (solvers) | Target 3–4 |
| Friends per active player | Social graph depth |
| Culturdle+ conversion | Paying ÷ monthly active players |

## 12. Risks

| Risk | Mitigation |
|---|---|
| Copyright in synopsis text | Rewrite every Moment hint before launch |
| Celebrity personality rights (India) | No photos of people; names and facts only; no celebrity used in ads or sponsored puzzles |
| Logos are trademarks | Logo described in words; images only with rights |
| Factual errors | Verify flag on every row; in-app "Report a problem"; reveal-card fixes go live instantly |
| Spoilers across time zones | Spoiler-free share block; no answers on Culturdle socials until the next reset |
| Thin India Icons pool | Add about 30 India icons a month from the day of launch |

## 13. Roadmap (no fixed dates)

1. **Content clean-up:** verify curated rows, rewrite Moment hints, playtest 100 puzzles for difficulty.
2. **Launch:** six daily puzzles, guest play, share block, streaks, stats, web and apps.
3. **Social:** accounts, friends, weekly league, private groups, push reminder.
4. **Revenue:** Culturdle+ archive and freezes, light ads.
5. **Images:** posters and logos where licensed; images as an optional extra hint.

---

Sources: Wikipedia, "The New York Times Games" (play counts, citing The Verge, June 2025); AFP via Philstar, "New York Times buys Wordle" (31 Jan 2022); GameSpot on Framed; Esports.net on LoLdle; Artnet on Artle. Dataset links are in the workbook's Sources tab.
