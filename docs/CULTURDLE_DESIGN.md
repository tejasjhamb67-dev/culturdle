# Culturdle — Design Note and Build Spec

Version 1.0 · 16 October 2026 · Companion to `CULTURDLE_CONCEPT.md`
Audience: Claude Code (build) and TJ (review). Content source: `Culturdle_Question_Bank.xlsx`.

---

## Part A — Game design theory

### A1. Design principles

1. **One shared puzzle, once a day.** Scarcity creates the ritual; sharing creates the growth. Never offer unlimited live play.
2. **Short and finishable.** Each puzzle is one to two minutes. A player who only has time for one puzzle still keeps the streak.
3. **Recognition, not research.** Every hint should trigger memory ("oh, that song!"), never require a search engine.
4. **Hard but fair.** About half of players solve each puzzle. Every hint is true and useful; options on guess 6 give everyone a last shot, and the reveal card turns a miss into a fact learned.
5. **Fair competition.** Same puzzle, same difficulty, same hints for everyone on the same day.
6. **Calm, not compulsive.** One daily reminder at most, no timers, no loot boxes, no paid hints.

### A2. The hint ladder

Each puzzle has six hints. Hint 1 shows at the start; each miss (or skip) reveals the next. Hint 6 appears on guess 6 together with four options.

The ladder runs from ambiguous to clearer, but never hands over the answer:

| Step | Job | Example (Movie: Sholay) |
|---|---|---|
| Hint 1 — Frame | Very broad; thousands of films fit | Theme: Action · 1970s |
| Hint 2 — Craft | Rewards enthusiasts; casual players still guessing | Music by: R.D. Burman (lyrics: Anand Bakshi) |
| Hint 3 — Story | A plot moment with names masked | Moment: a former police officer enlists two outlaws to capture a bandit |
| Hint 4 — Maker | Strong narrowing for fans | Directed by: Ramesh Sippy |
| Hint 5 — Supporting cast | One co-star, not the lead | Co-star: Dharmendra |
| Hint 6 — Nudge + options | Initials and year only, plus four options | Lead actor's initials: S.K. · released 1975 |

**Targets** (to be tuned from live data):

- 75–90% of players solve each puzzle (including solves from the four options). Raised from 45–55% after playtest feedback: hints now name concrete facts (director, co-stars, lead, singer, film) rather than oblique clues.
- Median solve on guess 3–4 among solvers.
- Under 10% solve on guess 1.

**Rules for any hint**

- No word of the answer appears in a hint. The builder masks such words as `____`; the import must reject rows that still contain one.
- Hints 5 and 6 never name the answer's most identifying fact: no lead actor's full name for films, no artist name for songs, no film title for film songs. Use initials, shapes (word count and first letter) and supporting details.
- Plot hints mask character and place names.
- No song lyrics. Titles, credits and chart facts only.
- No photographs of people, and no logos as images until licensed.

### A3. Wrong-option design (guess 6)

The three wrong options come from the same edition and mode, and the same decade and genre where possible. For Icons they come from the same field (sport, screen, music, business, science, arts, brand). Decoys are plausible enough that guess 6 is a real choice, not a formality.

Shuffle the four options with a seed of `date + edition + mode`, so every player sees the same order.

### A4. Difficulty

- Each row carries `Easy`, `Medium` or `Hard` from the bank.
- The scheduler follows the weekly curve:

| Day | Difficulty |
|---|---|
| Mon–Wed | Easy |
| Thu–Fri | Medium |
| Sat | Hard |
| Sun | Easy or Medium, "Cult Classic" pick |

- After 30 days live, recompute difficulty from solve rate per puzzle: over 90% solved is Easy, 75–90% is Medium, under 75% is Hard. Retire or rewrite puzzles below 60% or above 97%. Use this to relabel rows that share a director, artist or decade.

### A5. Habit loop

```
Trigger      → daily reminder at the player's chosen time; friends' share posts
Action       → open, play one puzzle (≤ 2 min)
Reward       → hard-won "aha" (about half solve), points, streak +1, reveal fact, Shelf grows
Investment   → streak, weekly league position, friends, Shelf
```

### A6. Scoring

| Solved on | Points |
|---|---|
| Guess 1 | 6 |
| Guess 2 | 5 |
| Guess 3 | 4 |
| Guess 4 | 3 |
| Guess 5 | 2 |
| Guess 6 (with options) | 1 |
| Not solved | 0 |

- Daily score per edition: 0–18. Weekly league score: sum of daily scores across both editions, Monday 00:00 IST to Sunday 23:59 IST.
- Ties are shared ranks. Never use solve time; speed pressure makes the game exhausting.

### A7. Streaks

| Streak | Rule |
|---|---|
| Play streak | Finish at least one puzzle in the IST day |
| Mode win streak | Consecutive days a mode was solved (per edition) |
| Perfect Day | All three puzzles in one edition solved |
| Streak freeze | +1 per completed 7-day play streak; max 2 banked (Culturdle+: max 5); used automatically on a missed day |

### A8. Share block

Spoiler-free text that pastes cleanly into WhatsApp, X and Instagram.

```
Culturdle #142 · India 🇮🇳
🎬 🟥🟥🟩 3/6
🎵 🟩 1/6
⭐ 🟥🟥🟥🟥🟥🟨 6/6
🔥 12-day streak
<your domain>
```

- 🟥 = missed guess
- ⬜ = skipped
- 🟩 = solved with a typed guess
- 🟨 = solved from the four options
- ⬛ = not solved

Mode icons: 🎬 Movie · 🎵 Music · ⭐ Icon. The puzzle number counts days since launch.

The share sheet offers the text and a 1080×1920 Story image of the same grid.

---

## Part B — Product and screens

### B1. Navigation

Bottom tabs: **Today** · **Leagues** · **Shelf** · **Profile**.

### B2. Screens

| Screen | Contents |
|---|---|
| Onboarding (first run) | Three swipe cards: "Six puzzles a day", "A new hint after every miss", "Options on your last guess". Then pick a home edition (Global or India). Play as guest; sign-in prompt only after the first puzzle |
| Today | Two rows (home edition first), three tiles each: Movie, Music, Icon. Tile states: Play, In progress (guesses used), Solved (points), Missed. Countdown to next reset. Streak badge in the header |
| Puzzle | Header: mode and type ("Guess the song"). Hint stack: revealed hints as cards, newest at the bottom; locked hints shown as greyed slots numbered 2–6. Guess input with autocomplete. Skip link (counts as a guess). Six guess pips. On guess 6 the input is replaced by four option buttons |
| Reveal | Answer (large), year, reveal-card fact, points earned, per-guess emoji row. Buttons: Share, Next puzzle, Report a problem |
| Day summary | After all three puzzles of an edition: day score, Perfect Day badge, share block for the edition, prompt to play the other edition |
| Leagues | Tabs: Friends (weekly), Groups, Global/India (daily and weekly). Rows: rank, name, score, streak. Invite link button |
| Shelf | Grid of solved answers, filterable by mode, edition and decade; counts per decade |
| Profile | Stats per mode and edition: played, solve %, guess distribution, current and best streaks, freezes banked. Settings: home edition, reminder time, theme, account, Culturdle+ |
| Archive (Culturdle+) | Calendar of past puzzles; archive plays never count for leagues or streaks |

### B3. Guess input behaviour

- Autocomplete from the full list of answers of the same edition, mode and answer type (for example all Global songs). Show at most 6 suggestions after 2 characters.
- A guess must be a list item or match an answer or alias after normalisation, so random text never costs a guess.
- Normalisation: lowercase; strip accents, punctuation and a leading "the", "a" or "an"; collapse spaces.
- A correct match is the answer or any alias. A fuzzy match (Damerau–Levenshtein ≤ 1 for 5–8 characters, ≤ 2 above 8) is accepted only when it is unambiguous.
- Repeating an earlier wrong guess is blocked with a gentle shake.

### B4. Visual direction

- **Feel:** a night at the cinema. Dark, warm, marquee-lit; cards like ticket stubs.
- **Base palette** (light and dark themes; dark is the default):

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | #0E1116 | #F7F5F0 | Page |
| `surface` | #181C24 | #FFFFFF | Hint cards, tiles |
| `text` | #F4F1EA | #1A1A1A | Body |
| `muted` | #8A90A0 | #6B6B6B | Locked hints, labels |
| `movie` | #E5484D | #C8323A | Movie mode accent (red, like a curtain) |
| `music` | #8E4EC6 | #7B3FB0 | Music mode accent (purple, like stage light) |
| `icon` | #F5B83D | #C98A10 | Icon mode accent (gold, like a star) |
| `win` | #30A46C | #218358 | Solved |
| `options` | #F5D90A | #B59A00 | Solved via options |
| `miss` | #3A3F4B | #D4D4D4 | Missed guess pip |

- **Type:**
  - A condensed display face for answers and numbers (for example "Bebas Neue" or "Oswald")
  - A clean sans for everything else ("Inter")
  - Minimum 16 px body on mobile
- **Motion:**
  - A new hint slides up and flips like a ticket being torn (≤ 250 ms).
  - The answer reveals with a short marquee-light shimmer.
  - Respect reduced-motion settings.
- **Accessibility:**
  - Pips use shape as well as colour (✕ miss, ✓ solved, ◆ options).
  - All tap targets are 44 px or larger.
  - Screen-reader labels on every hint and pip.

---

## Part C — Build spec

### C1. Stack

- **Mobile:** Expo (React Native, TypeScript), Expo Router.
- **Web:** Next.js (App Router, TypeScript), deployed on Vercel.
- **Shared:** a `packages/core` workspace with game logic, normalisation, scoring and types, used by both apps.
- **Backend:** same as Foodle. If Foodle has no backend yet, use Supabase (Postgres + Auth + Row Level Security), with server-side game endpoints as Next.js route handlers.
- **Auth:** optional. Guests get an anonymous device ID; signing in (Google, Apple, email) merges guest history into the account.

### C2. Data model (Postgres)

```sql
create type edition as enum ('Global','India');
create type mode as enum ('movie','music','icon');
create type difficulty as enum ('Easy','Medium','Hard');
create type puzzle_status as enum ('draft','reviewed','live','retired');

create table puzzles (
  id            text primary key,          -- e.g. MOV-G-00042 (from sheet)
  edition       edition not null,
  mode          mode not null,
  answer_type   text not null,             -- Film | Song | Artist/Band | Artist (Singer) | Artist (Composer) | Person | Band | Brand
  category      text,                      -- Industry (movies) or Category (icons)
  difficulty    difficulty not null,
  answer        text not null,
  aliases       text[] not null default '{}',
  year          int,
  hints         text[] not null check (array_length(hints,1) = 6),
  wrong_options text[] not null check (array_length(wrong_options,1) = 3),
  reveal_fact   text,
  meta          jsonb not null default '{}', -- director, music, lead, artist
  source        text,
  verify_flag   text,
  status        puzzle_status not null default 'draft',
  updated_at    timestamptz not null default now()
);

create table schedule (
  play_date     date not null,             -- IST calendar date
  edition       edition not null,
  mode          mode not null,
  puzzle_id     text not null references puzzles(id),
  puzzle_number int not null,              -- days since launch, starting at 1
  primary key (play_date, edition, mode)
);

create table players (
  id            uuid primary key,          -- auth user id or anonymous device id
  handle        text unique,
  home_edition  edition not null default 'Global',
  reminder_time time,
  is_guest      boolean not null default true,
  created_at    timestamptz not null default now()
);

create table plays (
  player_id     uuid references players(id),
  play_date     date not null,
  edition       edition not null,
  mode          mode not null,
  guesses       jsonb not null default '[]', -- [{text, correct, skipped, at}]
  used_options  boolean not null default false,
  solved        boolean,
  guess_count   int,
  points        int,
  finished_at   timestamptz,
  primary key (player_id, play_date, edition, mode)
);

create table streaks (
  player_id     uuid primary key references players(id),
  current       int not null default 0,
  best          int not null default 0,
  freezes       int not null default 0,
  last_play_date date
);

create table friendships (
  player_id uuid references players(id),
  friend_id uuid references players(id),
  primary key (player_id, friend_id)
);

create table groups (id uuid primary key, name text not null, invite_code text unique not null, owner uuid references players(id));
create table group_members (group_id uuid references groups(id), player_id uuid references players(id), primary key (group_id, player_id));

create table reports (id bigserial primary key, puzzle_id text references puzzles(id), player_id uuid, message text, created_at timestamptz default now());
```

- Weekly league totals: a materialised view over `plays`, refreshed every 5 minutes, keyed by ISO week in IST.
- Row Level Security: players read and write only their own `plays` and `streaks`. `puzzles` and `schedule` are never readable directly by clients.

### C3. Importing the question bank

Script: `scripts/import-bank.ts` (run with `pnpm import:bank path/to/Culturdle_Question_Bank.xlsx`).

| Workbook column | `puzzles` field | Notes |
|---|---|---|
| ID | id | Upsert key |
| Edition | edition | |
| (sheet name) | mode | Movies → movie, Music → music, Icons → icon |
| Answer type | answer_type | Movies sheet has none: set `Film` |
| Industry / Category | category | |
| Difficulty | difficulty | |
| Answer | answer | |
| Accepted aliases | aliases | Split on " \| " |
| Year | year | Blank for Icons |
| Hint 1 … Hint 6 | hints[1..6] | Column headers begin "Hint 1" … "Hint 6" |
| Wrong option A, B, C | wrong_options | |
| Reveal-card fact | reveal_fact | |
| Director, Music, Lead, Artist | meta | Whichever exist on the sheet |
| Source | source | |
| Verify flag | verify_flag | |

**Validation (reject the row and log it):**

- Fewer than 6 non-empty hints.
- Fewer than 3 wrong options, or an option equal to the answer.
- A hint containing a word of the answer (normalised, words of 3+ characters, excluding "the", "and", "of" and similar).
- A duplicate answer within the same edition and mode.

Imported rows start as `draft`. Only `live` rows can be scheduled. Status is managed in a small admin page (C7), so TJ can mark rows `reviewed` and `live` as they are checked.

### C4. Scheduler

A nightly job that keeps the schedule filled 60 days ahead for each edition and mode:

1. Find the target difficulty from the weekday (IST).
2. Candidates are `status = 'live'` rows for that edition, mode and difficulty that have not been scheduled in the last 730 days.
3. Exclude rows that share the director, lead, artist or composer (from `meta`) with any puzzle in the same edition and mode during the last 14 days.
4. For Music, alternate answer types so that no more than two artist puzzles land in any seven days.
5. If no candidate remains, fall back to the next difficulty, then to rows not used in 365 days.
6. Pick at random with a fixed seed per date, so a re-run gives the same result.
7. Calendar overrides: a `schedule_overrides` table (date, edition, mode, puzzle_id) wins over the algorithm. Use it for birthdays, releases and festival days.
8. Alert when fewer than 90 days of unscheduled `live` rows remain in any pool.

### C5. API (Next.js route handlers)

The answer and later hints never reach the client before they are earned.

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /api/today` | `edition` | Puzzle number, the three modes with `answer_type`, the player's state per mode (hints revealed so far, guesses, finished, points), seconds to next reset |
| `POST /api/play/:edition/:mode/guess` | `{ text }` or `{ skip: true }` or `{ option: string }` | `{ correct, hintsRevealed: string[], options?: string[] (only on guess 6), finished, answer?, revealFact?, points? }` |
| `GET /api/suggest` | `edition`, `mode`, `answer_type`, `q` | Up to 6 names from the answer list of that pool |
| `GET /api/leagues/friends` | — | Weekly ranks |
| `GET /api/leagues/global` | `edition`, `period=day\|week` | Top 100 and the player's rank |
| `POST /api/groups` / `POST /api/groups/join` | `{ name }` / `{ code }` | Group |
| `POST /api/report` | `{ puzzleId, message }` | 204 |
| `GET /api/share/:date/:edition` | — | Share text and a Story image URL |

**Server rules**

- The play date is always the server's IST date. Ignore the client clock.
- One `plays` row per player, date, edition and mode. Reject guesses after it is finished.
- `options` is returned only when the player reaches guess 6. Its order is a seeded shuffle of the answer and the three wrong options.
- On finish: compute points, update streaks (consuming a freeze if yesterday was missed), and return the reveal.
- Rate limit: 30 guesses per minute per player.

### C6. Notifications

- One optional daily push at the player's chosen time: "Today's Culturdle is live — 🎬 🎵 ⭐".
- No other pushes, except "Your streak freeze was used" and "A friend passed you in this week's league", capped at one per day in total.

### C7. Admin (web, TJ only)

- Puzzle table with search and filters (edition, mode, difficulty, status, verify flag).
- Inline edit of hints, options, reveal fact and aliases.
- Status buttons: Reviewed, Live, Retired.
- Schedule calendar with drag-to-swap and overrides.
- Reports inbox, linked to the puzzle.
- Live stats per puzzle: plays, solve rate, guess distribution. These feed the difficulty recalibration in A4.

### C8. Analytics events

`app_open`, `puzzle_start`, `guess` (number, correct, skipped), `options_shown`, `puzzle_finish` (solved, guess_count, points), `share` (channel), `streak_freeze_used`, `league_view`, `invite_sent`, `invite_joined`, `report_submitted`, `subscribe`.

### C9. Build order

1. `packages/core`: normalisation, alias matching, scoring, streak rules, seeded shuffle, with unit tests.
2. Database schema, import script, validation report.
3. Scheduler and `schedule_overrides`.
4. Game API (`/today`, `/guess`, `/suggest`) with server-held state.
5. Web app: Today, Puzzle, Reveal, Day summary, Share.
6. Expo app with the same screens.
7. Accounts, guest merge, streaks, stats.
8. Friends, groups and leagues.
9. Admin tool.
10. Culturdle+ (archive, freezes) and ads.

### C10. Definition of done for launch

- At least 90 days of `live`, verified puzzles per edition and mode.
- Every Movie "Moment" hint rewritten in original words.
- All six daily puzzles playable on web, iOS and Android as a guest.
- The share block renders correctly in WhatsApp, X and Instagram Stories.
- A playtest of the first 14 days with 20+ players shows a solve rate between 75% and 90%.

---

### Appendix — current content status (from the workbook)

| Pool | Rows | Easy | Medium | Hard | Rows flagged as curated (verify first) |
|---|---|---|---|---|---|
| Movies · Global | 2,161 | 365 | 711 | 1,085 | 81 (2017–2025 films) |
| Movies · India | 2,124 | 873 | 421 | 830 | 0 |
| Music · Global | 5,752 | 902 | 1,732 | 3,118 | 0 |
| Music · India | 3,832 | 786 | 1,219 | 1,827 | 0 |
| Icons · Global | 835 | 299 | 336 | 200 | Curated people and brands |
| Icons · India | 406 | 133 | 170 | 103 | Curated people and brands |

Total curated rows across Movies and Icons: 814 (81 films, 733 icons and brands).

At the weekly curve (three Easy days a week, about 156 Easy puzzles a year per pool, before Cult Classic Sundays), Easy puzzles last about 0.9 years for Icons · India, 1.9 years for Icons · Global and 2.3 years for Movies · Global; every other pool has 5+ years. Add India icons from launch, and promote well-known Medium rows to Easy as solve-rate data comes in.
