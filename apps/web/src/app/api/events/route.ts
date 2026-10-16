import { body, handler, HttpError } from "@/lib/http";
import { CLIENT_EVENTS, track } from "@/lib/events";
import { currentPlayer } from "@/lib/player";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export const POST = handler(async (req: Request) => {
  const { name, props } = await body<{ name: string; props?: Record<string, unknown> }>(req);
  if (!CLIENT_EVENTS.has(name)) throw new HttpError(400, "bad_event");
  const p = await currentPlayer();
  rateLimit(`events:${p?.id ?? "anon"}`, 60);
  await track(name, p?.id ?? null, typeof props === "object" && props ? props : {});
  return new Response(null, { status: 204 });
});
