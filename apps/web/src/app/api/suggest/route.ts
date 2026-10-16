import { assertEdition, assertMode } from "@/lib/game";
import { handler, json } from "@/lib/http";
import { suggestNames } from "@/lib/pools";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const names = await suggestNames(
    assertEdition(sp.get("edition")),
    assertMode(sp.get("mode")),
    sp.get("answer_type") ?? "",
    (sp.get("q") ?? "").slice(0, 80),
  );
  return json({ suggestions: names }, { headers: { "Cache-Control": "public, max-age=300" } });
});
