import { istDate } from "@culturdle/core";
import { assertEdition, assertMode, makeGuess, type GuessInput } from "@/lib/game";
import { body, handler, HttpError, json } from "@/lib/http";
import { requirePlayer } from "@/lib/player";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export const POST = handler(async (req: Request, ctx: { params: Promise<{ edition: string; mode: string }> }) => {
  const { edition, mode } = await ctx.params;
  const input = await body<GuessInput & { date?: string }>(req);
  const date = input.date ?? istDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "bad_date");
  const player = await requirePlayer();
  rateLimit(`guess:${player.id}`);
  const view = await makeGuess(player, assertEdition(edition), assertMode(mode), input, date);
  const last = view.guesses[view.guesses.length - 1];
  return json({
    correct: !!last?.correct,
    hintsRevealed: view.hints,
    options: view.options ?? undefined,
    finished: view.finished,
    answer: view.reveal?.answer,
    revealFact: view.reveal?.fact,
    points: view.points ?? undefined,
    puzzle: view,
  });
});
