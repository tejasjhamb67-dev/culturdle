import {
  applyGuess, daysBetween, displayStreak, EDITIONS, emptyPlay, hintsVisible, istDate, MAX_FREEZES_FREE,
  MAX_FREEZES_PLUS, MAX_GUESSES, MODES, normalize, optionsFor, optionsVisible, pipsFor, promptFor,
  recordPlayDay, resolveGuess, secondsToNextReset, shareText,
  type Edition, type GuessRecord, type Mode, type PlayState, type Pip,
} from "@culturdle/core";
import { query, tx, type Q } from "./db";
import { HttpError } from "./http";
import { poolFor } from "./pools";
import { slotFor, slotsFor, type SlotRow } from "./schedule";
import { track } from "./events";
import { SITE_DOMAIN } from "./config";
import type { Player } from "./player";

export interface PuzzleRow {
  id: string;
  edition: Edition;
  mode: Mode;
  answer_type: string;
  category: string | null;
  difficulty: string;
  answer: string;
  aliases: string[];
  year: number | null;
  hints: string[];
  wrong_options: string[];
  reveal_fact: string | null;
}

interface PlayRow {
  guesses: GuessRecord[];
  used_options: boolean;
  solved: boolean | null;
  points: number | null;
  finished_at: string | null;
  is_archive: boolean;
}

export interface PuzzleView {
  date: string;
  edition: Edition;
  mode: Mode;
  puzzleNumber: number;
  answerType: string;
  prompt: string;
  hints: string[];
  guesses: { text: string; correct: boolean; skipped: boolean; option?: boolean }[];
  pips: Pip[];
  guessesUsed: number;
  maxGuesses: number;
  finished: boolean;
  solved: boolean | null;
  points: number | null;
  options: string[] | null;
  reveal: { answer: string; year: number | null; fact: string | null; category: string | null } | null;
  archive: boolean;
}

export function assertEdition(e: string | null): Edition {
  if (e === "Global" || e === "India") return e;
  if (e?.toLowerCase() === "global") return "Global";
  if (e?.toLowerCase() === "india") return "India";
  throw new HttpError(400, "bad_edition", "edition must be Global or India");
}
export function assertMode(m: string | null): Mode {
  if (m === "movie" || m === "music" || m === "icon") return m;
  throw new HttpError(400, "bad_mode", "mode must be movie, music or icon");
}

export async function loadPuzzle(id: string, q: Q = query): Promise<PuzzleRow> {
  const [row] = await q<PuzzleRow>(
    `select id, edition, mode, answer_type, category, difficulty, answer, aliases, year, hints, wrong_options, reveal_fact
     from puzzles where id = $1`,
    [id],
  );
  if (!row) throw new HttpError(404, "no_puzzle");
  return row;
}

function toState(row: PlayRow | undefined): PlayState {
  if (!row) return emptyPlay();
  return {
    guesses: row.guesses ?? [],
    usedOptions: row.used_options,
    solved: row.solved,
    finished: !!row.finished_at,
    points: row.points,
  };
}

export function buildView(slot: SlotRow, p: PuzzleRow, state: PlayState, archive: boolean): PuzzleView {
  const used = state.guesses.length;
  const showOptions = optionsVisible(used, state.finished);
  return {
    date: slot.play_date,
    edition: slot.edition,
    mode: slot.mode,
    puzzleNumber: slot.puzzle_number,
    answerType: p.answer_type,
    prompt: promptFor(slot.mode, p.answer_type),
    hints: p.hints.slice(0, hintsVisible(used, state.finished)),
    guesses: state.guesses.map(({ text, correct, skipped, option }) => ({ text, correct, skipped, ...(option ? { option } : {}) })),
    pips: pipsFor(state),
    guessesUsed: used,
    maxGuesses: MAX_GUESSES,
    finished: state.finished,
    solved: state.solved,
    points: state.points,
    options: showOptions ? optionsFor(slot.play_date, slot.edition, slot.mode, p.answer, p.wrong_options) : null,
    reveal: state.finished ? { answer: p.answer, year: p.year, fact: p.reveal_fact, category: p.category } : null,
    archive,
  };
}

async function playRowFor(playerId: string, date: string, edition: Edition, mode: Mode, q: Q = query, lock = false) {
  const [row] = await q<PlayRow>(
    `select guesses, used_options, solved, points, finished_at, is_archive from plays
     where player_id = $1 and play_date = $2::date and edition = $3 and mode = $4 ${lock ? "for update" : ""}`,
    [playerId, date, edition, mode],
  );
  return row;
}

function checkDate(player: Player, date: string): { archive: boolean } {
  const today = istDate();
  const diff = daysBetween(date, today);
  if (diff < 0) throw new HttpError(404, "not_yet", "That puzzle is not out yet");
  if (diff > 0 && !player.is_plus) throw new HttpError(403, "plus_required", "The archive is part of Culturdle+");
  return { archive: diff > 0 };
}

export async function getPuzzle(player: Player, edition: Edition, mode: Mode, date = istDate()): Promise<PuzzleView> {
  const { archive } = checkDate(player, date);
  const slot = await slotFor(date, edition, mode);
  if (!slot) throw new HttpError(404, "no_puzzle", "No puzzle scheduled");
  const p = await loadPuzzle(slot.puzzle_id);
  return buildView(slot, p, toState(await playRowFor(player.id, date, edition, mode)), archive);
}

export type GuessInput = { text?: string; skip?: boolean; option?: string };

export async function makeGuess(player: Player, edition: Edition, mode: Mode, input: GuessInput, date = istDate()) {
  const { archive } = checkDate(player, date);
  const slot = await slotFor(date, edition, mode);
  if (!slot) throw new HttpError(404, "no_puzzle", "No puzzle scheduled");
  const p = await loadPuzzle(slot.puzzle_id);
  const pool = await poolFor(edition, mode, p.answer_type);
  let started = false;
  let freezesUsed = 0;

  const state = await tx(async (q) => {
    let row = await playRowFor(player.id, date, edition, mode, q, true);
    if (!row) {
      await q(
        `insert into plays (player_id, play_date, edition, mode, puzzle_id, is_archive)
         values ($1, $2::date, $3, $4, $5, $6) on conflict do nothing`,
        [player.id, date, edition, mode, p.id, archive],
      );
      row = await playRowFor(player.id, date, edition, mode, q, true);
      started = true;
    }
    const st = toState(row);
    if (st.finished) throw new HttpError(409, "finished", "You have already finished this puzzle");
    const onFinal = st.guesses.length === MAX_GUESSES - 1;
    let guess: { text: string; correct: boolean; skipped: boolean; option?: boolean };

    if (input.option != null) {
      if (!onFinal) throw new HttpError(400, "no_options", "Options appear on your sixth guess");
      const opts = optionsFor(date, edition, mode, p.answer, p.wrong_options);
      if (!opts.includes(input.option)) throw new HttpError(400, "bad_option", "Pick one of the four options");
      guess = { text: input.option, correct: input.option === p.answer, skipped: false, option: true };
    } else if (input.skip) {
      guess = { text: "", correct: false, skipped: true };
    } else {
      const text = (input.text ?? "").toString().slice(0, 200);
      if (onFinal) throw new HttpError(400, "use_options", "Pick one of the four options");
      const res = resolveGuess(text, { answer: p.answer, aliases: p.aliases }, pool);
      if (res.kind === "unknown") throw new HttpError(422, "not_in_list", "Pick a name from the list");
      if (res.kind === "ambiguous") {
        throw new HttpError(422, "ambiguous", "Did you mean one of these?", { candidates: res.candidates });
      }
      const matched = res.matched;
      if (!res.kind.startsWith("correct") && st.guesses.some((g) => !g.skipped && normalize(g.text) === normalize(matched))) {
        throw new HttpError(409, "repeat", "You already tried that");
      }
      guess = { text: matched, correct: res.kind === "correct", skipped: false };
    }

    const next = applyGuess(st, guess, new Date().toISOString());
    await q(
      `update plays set guesses = $5::text::jsonb, used_options = $6, solved = $7, guess_count = $8, points = $9,
              finished_at = case when $10 then now() else null end
       where player_id = $1 and play_date = $2::date and edition = $3 and mode = $4`,
      [player.id, date, edition, mode, JSON.stringify(next.guesses), next.usedOptions, next.solved,
       next.finished ? next.guesses.length : null, next.points, next.finished],
    );

    if (next.finished && !archive) {
      const [s] = await q<{ current: number; best: number; freezes: number; last_play_date: string | null }>(
        `select current, best, freezes, last_play_date::text as last_play_date from streaks where player_id = $1 for update`,
        [player.id],
      );
      const prev = s
        ? { current: s.current, best: s.best, freezes: s.freezes, lastPlayDate: s.last_play_date }
        : { current: 0, best: 0, freezes: 0, lastPlayDate: null };
      const r = recordPlayDay(prev, date, player.is_plus ? MAX_FREEZES_PLUS : MAX_FREEZES_FREE);
      freezesUsed = r.freezesUsed;
      await q(
        `insert into streaks (player_id, current, best, freezes, last_play_date) values ($1, $2, $3, $4, $5::date)
         on conflict (player_id) do update set current = $2, best = $3, freezes = $4, last_play_date = $5::date`,
        [player.id, r.state.current, r.state.best, r.state.freezes, r.state.lastPlayDate],
      );
    }
    return next;
  });

  const props = { edition, mode, date, puzzle_id: p.id, archive };
  if (started) void track("puzzle_start", player.id, props);
  const last = state.guesses[state.guesses.length - 1];
  void track("guess", player.id, { ...props, number: state.guesses.length, correct: last.correct, skipped: last.skipped });
  if (state.guesses.length === MAX_GUESSES - 1 && !state.finished) void track("options_shown", player.id, props);
  if (state.finished) {
    void track("puzzle_finish", player.id, { ...props, solved: state.solved, guess_count: state.guesses.length, points: state.points });
  }
  if (freezesUsed) void track("streak_freeze_used", player.id, { count: freezesUsed });

  return buildView(slot, p, state, archive);
}

export async function streakFor(playerId: string) {
  const [s] = await query<{ current: number; best: number; freezes: number; last_play_date: string | null }>(
    `select current, best, freezes, last_play_date::text as last_play_date from streaks where player_id = $1`,
    [playerId],
  );
  const st = s
    ? { current: s.current, best: s.best, freezes: s.freezes, lastPlayDate: s.last_play_date }
    : { current: 0, best: 0, freezes: 0, lastPlayDate: null };
  return { current: displayStreak(st, istDate()), best: st.best, freezes: st.freezes, lastPlayDate: st.lastPlayDate };
}

export interface TileState {
  mode: Mode;
  prompt: string;
  status: "play" | "in_progress" | "solved" | "missed";
  guessesUsed: number;
  points: number | null;
  pips: Pip[];
}

/** Today screen: both editions, tile state per mode, day summaries, countdown, streak. */
export async function getDay(player: Player, date = istDate()) {
  const slots = await slotsFor(date);
  if (slots.length === 0) throw new HttpError(503, "no_schedule", "Today's puzzles are not scheduled yet");
  const puzzles = new Map(
    (
      await query<{ id: string; answer_type: string }>(`select id, answer_type from puzzles where id in (select puzzle_id from schedule where play_date = $1::date)`, [date])
    ).map((r) => [r.id, r]),
  );
  const plays = await query<PlayRow & { edition: Edition; mode: Mode }>(
    `select edition, mode, guesses, used_options, solved, points, finished_at, is_archive from plays
     where player_id = $1 and play_date = $2::date`,
    [player.id, date],
  );
  const streak = await streakFor(player.id);
  const editions = EDITIONS.map((edition) => {
    const tiles: TileState[] = MODES.map((mode) => {
      const slot = slots.find((s) => s.edition === edition && s.mode === mode);
      const st = toState(plays.find((r) => r.edition === edition && r.mode === mode));
      const answerType = slot ? puzzles.get(slot.puzzle_id)?.answer_type ?? "" : "";
      return {
        mode,
        prompt: promptFor(mode, answerType),
        status: st.finished ? (st.solved ? "solved" : "missed") : st.guesses.length ? "in_progress" : "play",
        guessesUsed: st.guesses.length,
        points: st.points,
        pips: pipsFor(st),
      };
    });
    const states = Object.fromEntries(MODES.map((m) => [m, toState(plays.find((r) => r.edition === edition && r.mode === m))])) as Record<Mode, PlayState>;
    const finished = tiles.filter((t) => t.status === "solved" || t.status === "missed").length;
    const score = tiles.reduce((a, t) => a + (t.points ?? 0), 0);
    return {
      edition,
      puzzleNumber: slots.find((s) => s.edition === edition)?.puzzle_number ?? 0,
      tiles,
      summary: {
        finished,
        complete: finished === 3,
        score,
        perfect: tiles.every((t) => t.status === "solved"),
        share: shareText({ puzzleNumber: slots[0].puzzle_number, edition, plays: states, streak: streak.current, url: SITE_DOMAIN }),
      },
    };
  });
  const home = player.home_edition;
  editions.sort((a, b) => (a.edition === home ? -1 : b.edition === home ? 1 : 0));
  return { date, secondsToReset: secondsToNextReset(), streak, homeEdition: home, editions };
}

export async function shareFor(player: Player, date: string, edition: Edition) {
  const slots = (await slotsFor(date)).filter((s) => s.edition === edition);
  if (!slots.length) throw new HttpError(404, "no_puzzle");
  const plays = await query<PlayRow & { mode: Mode }>(
    `select mode, guesses, used_options, solved, points, finished_at, is_archive from plays
     where player_id = $1 and play_date = $2::date and edition = $3`,
    [player.id, date, edition],
  );
  const states = Object.fromEntries(plays.map((r) => [r.mode, toState(r)])) as Partial<Record<Mode, PlayState>>;
  const streak = await streakFor(player.id);
  return {
    puzzleNumber: slots[0].puzzle_number,
    states,
    streak: streak.current,
    text: shareText({ puzzleNumber: slots[0].puzzle_number, edition, plays: states, streak: streak.current, url: SITE_DOMAIN }),
  };
}
