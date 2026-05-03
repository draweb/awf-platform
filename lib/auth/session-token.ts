import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

const COOKIE = "awf_session";

export type SessionJwtPayload = {
  sub: string;
  sid: string;
  role: UserRole;
  email: string;
};

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSessionJwt(
  secret: string,
  payload: SessionJwtPayload,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({
    role: payload.role,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(payload.sid)
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey(secret));
}

export async function verifySessionJwt(
  secret: string,
  token: string,
): Promise<SessionJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret), { algorithms: ["HS256"] });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const sid = typeof payload.jti === "string" ? payload.jti : null;
    const role = payload.role as UserRole;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!sub || !sid || !role || !email) return null;
    return { sub, sid, role, email };
  } catch {
    return null;
  }
}

export { COOKIE as SESSION_COOKIE_NAME };
