# Culturdle

The daily pop-culture guessing game: six puzzles a day (a movie, a song or artist, and an icon, in a
Global and an India edition), six guesses each, and a new hint after every miss.
Live: https://culturdle.vercel.app · Design file (Foodle system tokens, components, screens): https://www.figma.com/design/62rlGjVVopdopBPZH8fOTq
Product docs: [`docs/CULTURDLE_CONCEPT.md`](docs/CULTURDLE_CONCEPT.md) and [`docs/CULTURDLE_DESIGN.md`](docs/CULTURDLE_DESIGN.md).
Visual design follows the shared Foodle design system ([`docs/Foodle_Design_System.docx`](docs/Foodle_Design_System.docx)), which replaces §B4 of the Culturdle design note: Wordle palette (green = solved, yellow = solved from the options, grey = miss), Inter + Lora, tile wordmark, top bar + drawer on phones, three columns on desktop.

## Quick start (local, zero setup)

```bash
pnpm install
pnpm setup:local   # migrate, import the bank (marked live for local play), fill the schedule
pnpm dev           # http://localhost:3000 · admin at /admin (password "admin" in dev)
```

Locally the app runs on an embedded Postgres (PGlite) stored in `.data/pglite`, so you need no
database server. Set `DATABASE_URL` to use Supabase or any other Postgres instead.

## Layout

| Path | What |
|---|---|
| `packages/core` | Shared game logic: normalisation, fuzzy matching, scoring, streaks, seeded shuffle, IST dates, scheduler, share block, row validation. Unit-tested; meant to be reused by an Expo app. |
| `apps/web` | Next.js (App Router) web app **and** backend (route handlers under `src/app/api`). |
| `apps/web/src/lib` | Server modules: `db` (PGlite / postgres.js), `game`, `schedule`, `pools`, `social`, `stats`, `player`, `admin`. |
| `apps/web/scripts` | `import-bank.ts`, `schedule.ts`, `migrate.ts`. |
| `supabase/migrations` | SQL schema (design §C2), with RLS on and no client policies. |
| `content/` | The question bank workbook. |

## Commands

| Command | Does |
|---|---|
| `pnpm import:bank path/to.xlsx [--status draft\|reviewed\|live] [--force-status]` | Upserts the bank. New rows get `--status` (default `draft`); existing rows keep their status. Invalid rows are rejected into `import_log` and `.data/import-report.csv`. |
| `pnpm schedule` | Fills the schedule 60 days ahead and prints runway and alerts. |
| `pnpm db:migrate` | Applies migrations (the server also self-migrates on first connection). |
| `pnpm test` | Core unit tests and backend integration tests (in-memory PGlite). |

## How the backend follows the spec

- **Answers never leak:** the client receives only the hints it has earned. Options appear only on guess 6, in a seeded order (`date|edition|mode`), and the answer appears only once the puzzle is finished.
- **Server IST date:** the server ignores the client clock. There is one `plays` row per player, date, edition and mode, updated under a row lock. Guesses are rate-limited to 30 a minute.
- **Guess matching:** a guess must be a list item, the answer or an alias. A fuzzy match (Damerau–Levenshtein ≤1 at 5–8 characters, ≤2 above that) counts only when it is unambiguous. Unknown text and repeats never cost a guess.
- **Scheduler:** follows the weekly difficulty curve, has a 730-day no-repeat window and a 14-day cool-off on shared director/lead/artist/composer, allows at most 2 music artist puzzles per 7 days, falls back step by step, is deterministic per date, and lets calendar overrides win. It alerts when a pool has under 90 days of runway.
- **Guests:** an HMAC-signed cookie identifies each guest. A "player key" moves a profile to another device until real sign-in ships.

## Deploying (Vercel + Supabase)

1. Create a Supabase project. Copy its **transaction pooler** connection string into `DATABASE_URL`.
2. Create a Vercel project with **Root Directory** = `apps/web`, and set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET` and `NEXT_PUBLIC_SITE_URL`.
3. From your machine, with `DATABASE_URL` exported: `pnpm import:bank content/Culturdle_Question_Bank.xlsx` (rows arrive as `draft`), mark rows `live` in `/admin`, then run `pnpm schedule`.
4. `vercel.json` runs the scheduler nightly at 00:30 IST (19:00 UTC).

## Not built yet

- Expo iOS/Android app (`packages/core` is ready to share)
- Google/Apple/email sign-in with guest merge
- Push reminders (reminder time is stored)
- Culturdle+ billing (admin can grant Plus by friend code)
- Ads
- The content clean-up in concept §8 (rewriting Moment hints, verifying curated rows)

## Deployments

The Vercel project `culturdle-app` is connected to this GitHub repository: every push to the production branch (`claude/dreamy-rubin-36vvyz`, the repo default) deploys to https://culturdle.vercel.app, and pushes to other branches get preview URLs.
