import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { signSessionJwt, type SessionJwtPayload } from "./session-token";
import { BROWSER_SESSION_MAX_DAYS } from "./browser-session-policy";
import type { User } from "@prisma/client";

export { BROWSER_SESSION_MAX_DAYS } from "./browser-session-policy";

export async function createBrowserSession(user: User): Promise<{ cookieValue: string; expiresAt: Date }> {
  const e = env();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + BROWSER_SESSION_MAX_DAYS);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: "jwt",
      expiresAt,
    },
  });

  const payload: SessionJwtPayload = {
    sub: user.id,
    sid: session.id,
    role: user.role,
    email: user.email,
  };

  const cookieValue = await signSessionJwt(e.SESSION_SECRET, payload, expiresAt);
  return { cookieValue, expiresAt };
}

export async function validateSessionToken(token: string): Promise<SessionJwtPayload | null> {
  const e = env();
  const { verifySessionJwt } = await import("./session-token");
  const payload = await verifySessionJwt(e.SESSION_SECRET, token);
  if (!payload) return null;
  const session = await prisma.session.findFirst({
    where: { id: payload.sid, userId: payload.sub, expiresAt: { gt: new Date() } },
  });
  if (!session) return null;
  return payload;
}

export async function destroySession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export { SESSION_COOKIE_NAME } from "./session-token";
