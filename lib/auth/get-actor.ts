import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http/errors";
import { verifySessionJwt, SESSION_COOKIE_NAME } from "./session-token";
import { findCliTokenByRaw, touchCliTokenUsed } from "./cli-token";
import { findPatByRawToken, touchPatUsed } from "./pat";

export type Actor = {
  userId: string;
  email: string;
  role: UserRole;
  authMethod: "session" | "pat" | "cli_session";
  scopes: string[];
  patId?: string;
  /** Present only when `authMethod === "session"` (sesión cookie en navegador). */
  sessionId?: string;
  /** Present only when `authMethod === "cli_session"` (token `awf_cli_*`). */
  cliAccessTokenId?: string;
};

export async function getActor(request: NextRequest): Promise<Actor | null> {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const raw = auth.slice(7).trim();
    if (raw.startsWith("awf_pat_")) {
      const row = await findPatByRawToken(raw);
      if (!row) return null;
      await touchPatUsed(row.id);
      return {
        userId: row.userId,
        email: row.user.email,
        role: row.user.role,
        authMethod: "pat",
        scopes: row.scopes,
        patId: row.id,
      };
    }
    if (raw.startsWith("awf_cli_")) {
      const row = await findCliTokenByRaw(raw);
      if (!row) return null;
      await touchCliTokenUsed(row.id);
      return {
        userId: row.userId,
        email: row.user.email,
        role: row.user.role,
        authMethod: "cli_session",
        scopes: [],
        cliAccessTokenId: row.id,
      };
    }
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const e = env();
  const payload = await verifySessionJwt(e.SESSION_SECRET, token);
  if (!payload) return null;
  const session = await prisma.session.findFirst({
    where: { id: payload.sid, userId: payload.sub, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!session) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
    authMethod: "session",
    scopes: [],
    sessionId: session.id,
  };
}

export function requireActor(actor: Actor | null): Actor {
  if (!actor) {
    throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
  }
  return actor;
}
