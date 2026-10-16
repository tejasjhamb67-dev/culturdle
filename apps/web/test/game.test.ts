import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.PGLITE_DIR = "memory://";
process.env.LAUNCH_DATE = "2026-10-01";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

const { query } = await import("@/lib/db");
const { makeGuess, getPuzzle, getDay, streakFor } = await import("@/lib/game");
const { ensureSchedule } = await import("@/lib/schedule");
const { friendsLeague, addFriend, createGroup, joinGroup, groupLeague } = await import("@/lib/social");
const { statsFor, shelfFor } = await import("@/lib/stats");
const { istDate } = await import("@culturdle/core");

const FILMS = ["Sholay", "Deewaar", "Zanjeer", "Don", "Trishul", "Kaalia", "Shakti", "Agneepath", "Coolie", "Namak Halaal"];

async function seed() {
  const rows: any[] = [];
  for (const edition of ["Global", "India"]) {
    for (const mode of ["movie", "music", "icon"]) {
      FILMS.forEach((name, i) => {
        for (const d of ["Easy", "Medium", "Hard"]) {
          const answer = `${name} ${d}${edition[0]}${mode}`;
          rows.push({
            id: `${mode}-${edition}-${i}-${d}`, edition, mode, answer_type: mode === "movie" ? "Film" : mode === "music" ? "Song" : "Person",
            difficulty: d, answer, hints: ["h1", "h2", "h3", "h4", "h5", "h6"],
            wrong: [`Decoy A${i}${d}`, `Decoy B${i}${d}`, `Decoy C${i}${d}`],
          });
        }
      });
    }
  }
  await query(
    `insert into puzzles (id, edition, mode, answer_type, difficulty, answer, hints, wrong_options, status)
     select r.id, r.edition::edition, r.mode::mode, r.answer_type, r.difficulty::difficulty, r.answer,
            array(select jsonb_array_elements_text(r.hints)), array(select jsonb_array_elements_text(r.wrong)), 'live'
     from jsonb_to_recordset($1::jsonb) as r(id text, edition text, mode text, answer_type text, difficulty text, answer text, hints jsonb, wrong jsonb)`,
    [JSON.stringify(rows)],
  );
}

async function newPlayer(code: string, plus = false) {
  const id = crypto.randomUUID();
  const [p] = await query(`insert into players (id, friend_code, is_plus) values ($1, $2, $3) returning *`, [id, code, plus]);
  return p as any;
}

async function answerOf(edition: string, mode: string, date = istDate()) {
  const [r] = await query(`select p.answer, p.wrong_options from schedule s join puzzles p on p.id = s.puzzle_id where s.play_date = $1::date and s.edition = $2 and s.mode = $3`, [date, edition, mode]);
  return r as { answer: string; wrong_options: string[] };
}

beforeAll(async () => {
  await seed();
  await ensureSchedule();
});

describe("game loop", () => {
  it("schedules six slots for today", async () => {
    const [{ n }] = await query(`select count(*)::int as n from schedule where play_date = $1::date`, [istDate()]);
    expect(n).toBe(6);
  });

  it("hides the answer and later hints until earned", async () => {
    const p = await newPlayer("AAAAAA");
    const v = await getPuzzle(p, "India", "movie");
    expect(v.hints).toEqual(["h1"]);
    expect(v.reveal).toBeNull();
    expect(v.options).toBeNull();
    expect(JSON.stringify(v)).not.toContain((await answerOf("India", "movie")).answer);
  });

  it("rejects text not in the list and repeats, without costing a guess", async () => {
    const p = await newPlayer("BBBBBB");
    await expect(makeGuess(p, "India", "movie", { text: "qwertyuiop" })).rejects.toMatchObject({ code: "not_in_list" });
    const { answer } = await answerOf("India", "movie");
    const wrongName = (await query(`select answer from puzzles where edition = 'India' and mode = 'movie' and answer <> $1 limit 1`, [answer]))[0].answer;
    let v = await makeGuess(p, "India", "movie", { text: wrongName });
    expect(v.guessesUsed).toBe(1);
    expect(v.hints).toEqual(["h1", "h2"]);
    await expect(makeGuess(p, "India", "movie", { text: wrongName })).rejects.toMatchObject({ code: "repeat" });
  });

  it("shows options on guess six and scores a solve from them", async () => {
    const p = await newPlayer("CCCCCC");
    for (let i = 0; i < 5; i++) await makeGuess(p, "Global", "music", { skip: true });
    const v = await getPuzzle(p, "Global", "music");
    expect(v.hints.length).toBe(6);
    expect(v.options).toHaveLength(4);
    await expect(makeGuess(p, "Global", "music", { text: "anything" })).rejects.toMatchObject({ code: "use_options" });
    const { answer } = await answerOf("Global", "music");
    const done = await makeGuess(p, "Global", "music", { option: answer });
    expect(done).toMatchObject({ finished: true, solved: true, points: 1 });
    expect(done.pips).toEqual(["skip", "skip", "skip", "skip", "skip", "options"]);
    expect(done.reveal?.answer).toBe(answer);
    await expect(makeGuess(p, "Global", "music", { skip: true })).rejects.toMatchObject({ code: "finished" });
  });

  it("scores a first-guess solve (with a typo), updates streak, day, stats, shelf and leagues", async () => {
    const p = await newPlayer("DDDDDD");
    const { answer } = await answerOf("India", "icon");
    const typo = answer.slice(0, -2) + answer.slice(-1) + answer.slice(-2, -1);
    const v = await makeGuess(p, "India", "icon", { text: typo });
    expect(v).toMatchObject({ finished: true, solved: true, points: 6 });
    expect((await streakFor(p.id)).current).toBe(1);
    const day = await getDay(p);
    const india = day.editions.find((e) => e.edition === "India")!;
    expect(india.tiles.find((t) => t.mode === "icon")?.status).toBe("solved");
    expect(india.summary.share).toContain("⭐ 🟩 1/6");
    const stats = await statsFor(p);
    expect(stats.totals).toMatchObject({ played: 1, solved: 1, points: 6 });
    expect((await shelfFor(p)).items[0].answer).toBe(answer);

    const friend = await newPlayer("EEEEEE");
    await addFriend(p, "EEEEEE");
    const league = await friendsLeague(friend);
    expect(league.rows.map((r) => [r.rank, r.score])).toEqual([[1, 6], [2, 0]]);

    const g = await createGroup(p, "Office");
    await joinGroup(friend, g.invite_code);
    expect((await groupLeague(friend, g.id)).rows).toHaveLength(2);
  });

  it("gates the archive behind Culturdle+ and keeps archive plays out of streaks", async () => {
    const free = await newPlayer("FFFFFF");
    const plus = await newPlayer("GGGGGG", true);
    const past = "2026-10-02";
    await expect(getPuzzle(free, "India", "movie", past)).rejects.toMatchObject({ code: "plus_required" });
    const v = await getPuzzle(plus, "India", "movie", past);
    expect(v.archive).toBe(true);
    const { answer } = await answerOf("India", "movie", past);
    await makeGuess(plus, "India", "movie", { text: answer }, past);
    expect((await streakFor(plus.id)).current).toBe(0);
  });
});
