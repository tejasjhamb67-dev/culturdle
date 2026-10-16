import crypto from "node:crypto";
import { cookies } from "next/headers";
import { sessionSecret } from "./config";
import { HttpError } from "./http";

const COOKIE = "cd_admin";

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  return process.env.NODE_ENV === "production" ? null : "admin";
}

const tokenFor = (pw: string) => crypto.createHmac("sha256", sessionSecret()).update(`admin:${pw}`).digest("base64url");

export async function adminLogin(password: string) {
  const pw = adminPassword();
  if (!pw) throw new HttpError(503, "admin_disabled", "Set ADMIN_PASSWORD to enable the admin");
  const a = Buffer.from(String(password ?? ""));
  const b = Buffer.from(pw);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(401, "bad_password", "Wrong password");
  (await cookies()).set(COOKIE, tokenFor(pw), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14,
  });
}

export async function adminLogout() {
  (await cookies()).delete(COOKIE);
}

export async function requireAdmin() {
  const pw = adminPassword();
  const got = (await cookies()).get(COOKIE)?.value;
  if (!pw || !got || got !== tokenFor(pw)) throw new HttpError(401, "admin_only", "Admin login required");
}
