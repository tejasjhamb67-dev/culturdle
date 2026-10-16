import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string, public extra?: Record<string, unknown>) {
    super(message ?? code);
  }
}

export function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

/** Wrap a route handler: HttpErrors become JSON error responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return json({ error: e.code, message: e.message, ...e.extra }, e.status);
      }
      console.error(e);
      // Admin routes are already authenticated; give them the real reason to speed up operations.
      const req = args[0] instanceof Request ? args[0] : null;
      const detail = req && new URL(req.url).pathname.startsWith("/api/admin/")
        ? String((e as Error)?.message ?? e).replace(/postgres(ql)?:\/\/\S+/g, "[url]").slice(0, 300)
        : undefined;
      return json({ error: "server_error", message: "Something went wrong", ...(detail ? { detail } : {}) }, 500);
    }
  };
}

export async function body<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "bad_json", "Expected a JSON body");
  }
}
