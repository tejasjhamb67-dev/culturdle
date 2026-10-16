import { describe, expect, it } from "vitest";
import {
  addDays, applyGuess, buildPool, damerauLevenshtein, difficultyFor, displayStreak, emptyPlay,
  emptyStreak, istDate, leakedWords, normalize, optionsFor, pickPuzzle, pipsFor, pointsFor,
  puzzleNumber, recordPlayDay, resolveGuess, secondsToNextReset, seededShuffle, shareText,
  suggest, validateRow, weekStart, type ScheduleCandidate,
} from "../src";

describe("normalize", () => {
  it("lowercases, strips accents, punctuation and leading articles", () => {
    expect(normalize("  The Dark   Knight! ")).toBe("dark knight");
    expect(normalize("Beyoncé")).toBe("beyonce");
    expect(normalize("A Star Is Born")).toBe("star is born");
    expect(normalize("Kabhi Khushi Kabhie Gham...")).toBe("kabhi khushi kabhie gham");
    expect(normalize("(500) Days of Summer")).toBe("500 days of summer");
    expect(normalize("Don't Stop Believin'")).toBe("dont stop believin");
  });
});

describe("damerauLevenshtein", () => {
  it("counts transpositions as one edit", () => {
    expect(damerauLevenshtein("sholay", "sholya")).toBe(1);
    expect(damerauLevenshtein("abc", "abc")).toBe(0);
    expect(damerauLevenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("resolveGuess", () => {
  const pool = buildPool([
    { key: "1", name: "Sholay", aliases: [] },
    { key: "2", name: "Deewaar", aliases: ["Deewar"] },
    { key: "3", name: "The Dark Knight", aliases: [] },
    { key: "4", name: "Dark Knight Rises", aliases: ["The Dark Knight Rises"] },
    { key: "5", name: "Inception", aliases: [] },
  ]);
  const target = { answer: "Sholay", aliases: [] };

  it("accepts the answer and aliases after normalisation", () => {
    expect(resolveGuess("sholay", target, pool).kind).toBe("correct");
    expect(resolveGuess("Deewar", { answer: "Deewaar", aliases: ["Deewar"] }, pool).kind).toBe("correct");
  });
  it("accepts an unambiguous typo", () => {
    expect(resolveGuess("Sholya", target, pool).kind).toBe("correct");
  });
  it("treats another pool item as a wrong guess", () => {
    const r = resolveGuess("inception", target, pool);
    expect(r).toMatchObject({ kind: "wrong", matched: "Inception" });
  });
  it("rejects random text without costing a guess", () => {
    expect(resolveGuess("zzzzzz", target, pool).kind).toBe("unknown");
    expect(resolveGuess("", target, pool).kind).toBe("unknown");
  });
  it("does not fuzzy-match short strings", () => {
    expect(resolveGuess("Shol", target, pool).kind).toBe("unknown");
  });
});

describe("suggest", () => {
  const pool = buildPool(
    ["Sholay", "Shaan", "Shakti", "Dil Se", "Sharaabi", "Shree 420", "Shahenshah", "Shatranj"].map((n, i) => ({
      key: String(i), name: n, aliases: [],
    })),
  );
  it("needs two characters and returns at most six", () => {
    expect(suggest(pool, "s")).toEqual([]);
    expect(suggest(pool, "sh").length).toBe(6);
  });
  it("matches word starts", () => {
    expect(suggest(pool, "se")).toEqual(["Dil Se"]);
  });
});

describe("scoring", () => {
  it("gives 6..1 points and 0 when unsolved", () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => pointsFor(true, n))).toEqual([6, 5, 4, 3, 2, 1]);
    expect(pointsFor(false, 6)).toBe(0);
  });
  it("finishes after a correct guess or six guesses", () => {
    let s = emptyPlay();
    for (let i = 0; i < 5; i++) s = applyGuess(s, { text: "x", correct: false, skipped: i === 2 }, "t");
    expect(s.finished).toBe(false);
    s = applyGuess(s, { text: "Sholay", correct: true, skipped: false, option: true }, "t");
    expect(s).toMatchObject({ finished: true, solved: true, points: 1, usedOptions: true });
    expect(pipsFor(s)).toEqual(["miss", "miss", "skip", "miss", "miss", "options"]);
    expect(() => applyGuess(s, { text: "x", correct: false, skipped: false }, "t")).toThrow();
  });
  it("marks the last pip as lost when unsolved", () => {
    let s = emptyPlay();
    for (let i = 0; i < 6; i++) s = applyGuess(s, { text: "x", correct: false, skipped: false }, "t");
    expect(s).toMatchObject({ finished: true, solved: false, points: 0 });
    expect(pipsFor(s).at(-1)).toBe("lost");
  });
});

describe("seeded shuffle", () => {
  it("is deterministic per seed and keeps all items", () => {
    const a = optionsFor("2026-10-16", "India", "movie", "Sholay", ["Deewaar", "Don", "Zanjeer"]);
    const b = optionsFor("2026-10-16", "India", "movie", "Sholay", ["Deewaar", "Don", "Zanjeer"]);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual(["Deewaar", "Don", "Sholay", "Zanjeer"]);
    expect(seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], "x")).not.toEqual(seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], "y"));
  });
});

describe("dates", () => {
  it("uses the IST calendar day", () => {
    expect(istDate(new Date("2026-10-16T18:29:59Z"))).toBe("2026-10-16");
    expect(istDate(new Date("2026-10-16T18:30:00Z"))).toBe("2026-10-17");
    expect(secondsToNextReset(new Date("2026-10-16T18:29:00Z"))).toBe(60);
  });
  it("numbers puzzles from launch and finds the Monday", () => {
    expect(puzzleNumber("2026-10-16", "2026-10-16")).toBe(1);
    expect(puzzleNumber(addDays("2026-10-16", 141), "2026-10-16")).toBe(142);
    expect(weekStart("2026-10-18")).toBe("2026-10-12"); // Sunday → Monday before
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
  });
  it("follows the weekly difficulty curve", () => {
    expect(difficultyFor("2026-10-12").primary).toEqual(["Easy"]); // Mon
    expect(difficultyFor("2026-10-15").primary).toEqual(["Medium"]); // Thu
    expect(difficultyFor("2026-10-17").primary).toEqual(["Hard"]); // Sat
    expect(difficultyFor("2026-10-18")).toEqual({ primary: ["Easy", "Medium"], cultClassic: true });
  });
});

describe("streaks", () => {
  it("counts consecutive days and earns a freeze every seven", () => {
    let s = emptyStreak();
    for (let i = 0; i < 7; i++) s = recordPlayDay(s, addDays("2026-10-01", i)).state;
    expect(s).toMatchObject({ current: 7, best: 7, freezes: 1 });
    // playing twice on one day changes nothing
    expect(recordPlayDay(s, "2026-10-07").state).toEqual(s);
  });
  it("uses a freeze on a missed day and restarts when there are not enough", () => {
    let s = { current: 7, best: 7, freezes: 1, lastPlayDate: "2026-10-07" };
    const r = recordPlayDay(s, "2026-10-09");
    expect(r.freezesUsed).toBe(1);
    expect(r.state).toMatchObject({ current: 8, freezes: 0 });
    s = r.state;
    expect(recordPlayDay(s, "2026-10-12").state.current).toBe(1);
  });
  it("caps banked freezes", () => {
    const s = { current: 13, best: 13, freezes: 2, lastPlayDate: "2026-10-01" };
    expect(recordPlayDay(s, "2026-10-02").state.freezes).toBe(2);
    expect(recordPlayDay(s, "2026-10-02", 5).state.freezes).toBe(3);
  });
  it("shows a lapsed streak as zero", () => {
    const s = { current: 4, best: 4, freezes: 0, lastPlayDate: "2026-10-01" };
    expect(displayStreak(s, "2026-10-02")).toBe(4);
    expect(displayStreak(s, "2026-10-03")).toBe(0);
  });
});

describe("validateRow", () => {
  it("rejects leaks, missing hints and bad options", () => {
    expect(leakedWords("Sholay", "Moment: the Sholay gang")).toEqual(["sholay"]);
    expect(leakedWords("Sholay", "Moment: the ____ gang")).toEqual([]);
    const ok = { answer: "Sholay", hints: ["a", "b", "c", "d", "e", "f"], wrongOptions: ["Don", "Deewaar", "Zanjeer"] };
    expect(validateRow(ok)).toEqual([]);
    expect(validateRow({ ...ok, hints: ["a", "b", "", "d", "e", "f"] })).toContain("fewer than 6 hints");
    expect(validateRow({ ...ok, wrongOptions: ["Don", "sholay", "x"] })).toContain("wrong option equals the answer");
  });
});

describe("pickPuzzle", () => {
  const cands: ScheduleCandidate[] = Array.from({ length: 40 }, (_, i) => ({
    id: `P${i}`,
    difficulty: (["Easy", "Medium", "Hard"] as const)[i % 3],
    answerType: "Film",
    people: [`director${i % 10}`],
  }));
  it("is deterministic and follows the day's difficulty", () => {
    const a = pickPuzzle({ date: "2026-10-12", edition: "India", mode: "movie", candidates: cands, history: [] });
    const b = pickPuzzle({ date: "2026-10-12", edition: "India", mode: "movie", candidates: cands, history: [] });
    expect(a).toEqual(b);
    expect(a?.difficulty).toBe("Easy");
  });
  it("never repeats within the window and avoids recent people", () => {
    const history: { date: string; puzzleId: string }[] = [];
    for (let i = 0; i < 20; i++) {
      const date = addDays("2026-10-12", i);
      const r = pickPuzzle({ date, edition: "India", mode: "movie", candidates: cands, history });
      expect(r).not.toBeNull();
      expect(history.some((h) => h.puzzleId === r!.puzzleId)).toBe(false);
      history.push({ date, puzzleId: r!.puzzleId });
    }
  });
});

describe("shareText", () => {
  it("renders the spoiler-free block", () => {
    let movie = emptyPlay();
    movie = applyGuess(movie, { text: "a", correct: false, skipped: false }, "t");
    movie = applyGuess(movie, { text: "b", correct: false, skipped: false }, "t");
    movie = applyGuess(movie, { text: "c", correct: true, skipped: false }, "t");
    const text = shareText({ puzzleNumber: 142, edition: "India", plays: { movie }, streak: 12, url: "culturdle.app" });
    expect(text).toBe(
      "Culturdle #142 · India 🇮🇳\n🎬 🟥🟥🟩 3/6\n🎵 not played\n⭐ not played\n🔥 12-day streak\nculturdle.app",
    );
  });
});
