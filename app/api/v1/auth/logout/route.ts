import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { destroySession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { verifySessionJwt } from "@/lib/auth/session-token";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const e = env();
      const payload = await verifySessionJwt(e.SESSION_SECRET, token);
      if (payload?.sid) await destroySession(payload.sid);
    }
    const res = jsonOk({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
