import { adminLogin, adminLogout, requireAdmin } from "@/lib/admin";
import { body, handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const GET = handler(async () => {
  await requireAdmin();
  return json({ ok: true });
});
export const POST = handler(async (req: Request) => {
  const { password } = await body<{ password: string }>(req);
  await adminLogin(password);
  return json({ ok: true });
});
export const DELETE = handler(async () => {
  await adminLogout();
  return new Response(null, { status: 204 });
});
