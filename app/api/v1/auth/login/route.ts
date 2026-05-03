import { Prisma } from "@prisma/client";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createBrowserSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { clientKeyFromRequest, isLoginRateLimited } from "@/lib/rate-limit/login";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    if (isLoginRateLimited(clientKeyFromRequest(request))) {
      throw new ApiError({
        code: "RATE_LIMITED",
        httpStatus: 429,
        message: "Demasiados intentos de login; probá más tarde",
      });
    }
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Body inválido",
        details: parsed.error.flatten(),
      });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Credenciales inválidas" });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Credenciales inválidas" });
    }
    const { cookieValue, expiresAt } = await createBrowserSession(user);
    const res = jsonOk({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
    return res;
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    if (process.env.NODE_ENV === "development" && isDatabaseMisconfiguredError(e)) {
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message:
              "Falta DATABASE_URL o la base no está accesible. Copiá apps/web/.env.example a .env.local, definí DATABASE_URL y asegurate de que Postgres esté en marcha (p. ej. docker compose en infra/).",
          },
        },
        { status: 503 },
      );
    }
    return jsonUnexpected();
  }
}

function isDatabaseMisconfiguredError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (!(e instanceof Error)) return false;
  const m = e.message;
  return (
    /Environment variable not found:\s*DATABASE_URL/i.test(m) ||
    /schema\.prisma:9/i.test(m) ||
    /Variables de entorno inválidas:.*DATABASE_URL/i.test(m) ||
    /Validation Error Count/i.test(m) ||
    /\bP1012\b/i.test(m)
  );
}
