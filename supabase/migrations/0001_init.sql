-- Culturdle schema (Postgres / Supabase). Follows CULTURDLE_DESIGN.md §C2.
-- Clients never talk to these tables directly: every read and write goes through the
-- Next.js API with a server-side connection. RLS is enabled with no policies, so the
-- Supabase anon/authenticated roles can read nothing.

do $$ begin create type edition as enum ('Global','India'); exception when duplicate_object then null; end $$;
do $$ begin create type mode as enum ('movie','music','icon'); exception when duplicate_object then null; end $$;
do $$ begin create type difficulty as enum ('Easy','Medium','Hard'); exception when duplicate_object then null; end $$;
do $$ begin create type puzzle_status as enum ('draft','reviewed','live','retired'); exception when duplicate_object then null; end $$;

create table if not exists puzzles (
  id            text primary key,
  edition       edition not null,
  mode          mode not null,
  answer_type   text not null,
  category      text,
  difficulty    difficulty not null,
  answer        text not null,
  aliases       text[] not null default '{}',
  year          int,
  hints         text[] not null check (array_length(hints,1) = 6),
  wrong_options text[] not null check (array_length(wrong_options,1) = 3),
  reveal_fact   text,
  meta          jsonb not null default '{}',
  source        text,
  verify_flag   text,
  status        puzzle_status not null default 'draft',
  updated_at    timestamptz not null default now()
);
create index if not exists puzzles_pool_idx on puzzles (edition, mode, status, difficulty);

create table if not exists schedule (
  play_date     date not null,
  edition       edition not null,
  mode          mode not null,
  puzzle_id     text not null references puzzles(id),
  puzzle_number int not null,
  primary key (play_date, edition, mode)
);
create index if not exists schedule_puzzle_idx on schedule (puzzle_id);

create table if not exists schedule_overrides (
  play_date date not null,
  edition   edition not null,
  mode      mode not null,
  puzzle_id text not null references puzzles(id),
  note      text,
  primary key (play_date, edition, mode)
);

create table if not exists players (
  id            uuid primary key,
  handle        text unique,
  friend_code   text unique not null,
  home_edition  edition not null default 'Global',
  reminder_time time,
  is_guest      boolean not null default true,
  is_plus       boolean not null default false,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create table if not exists plays (
  player_id     uuid not null references players(id) on delete cascade,
  play_date     date not null,
  edition       edition not null,
  mode          mode not null,
  puzzle_id     text references puzzles(id),
  guesses       jsonb not null default '[]',
  used_options  boolean not null default false,
  solved        boolean,
  guess_count   int,
  points        int,
  is_archive    boolean not null default false,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  primary key (player_id, play_date, edition, mode)
);
create index if not exists plays_date_idx on plays (play_date, edition) where not is_archive;
create index if not exists plays_puzzle_idx on plays (puzzle_id);

create table if not exists streaks (
  player_id      uuid primary key references players(id) on delete cascade,
  current        int not null default 0,
  best           int not null default 0,
  freezes        int not null default 0,
  last_play_date date
);

create table if not exists friendships (
  player_id uuid references players(id) on delete cascade,
  friend_id uuid references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (player_id, friend_id)
);

create table if not exists groups (
  id          uuid primary key,
  name        text not null,
  invite_code text unique not null,
  owner       uuid references players(id) on delete set null,
  created_at  timestamptz not null default now()
);
create table if not exists group_members (
  group_id  uuid references groups(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, player_id)
);

create table if not exists reports (
  id         bigserial primary key,
  puzzle_id  text references puzzles(id),
  player_id  uuid,
  message    text,
  resolved   boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists events (
  id         bigserial primary key,
  name       text not null,
  player_id  uuid,
  props      jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists events_name_idx on events (name, created_at);

create table if not exists import_log (
  id         bigserial primary key,
  run_at     timestamptz not null default now(),
  sheet      text,
  row_id     text,
  errors     text[]
);

alter table puzzles enable row level security;
alter table schedule enable row level security;
alter table schedule_overrides enable row level security;
alter table players enable row level security;
alter table plays enable row level security;
alter table streaks enable row level security;
alter table friendships enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table reports enable row level security;
alter table events enable row level security;
alter table import_log enable row level security;
