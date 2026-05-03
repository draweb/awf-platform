import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

/** Limpieza de sesiones expiradas (Vercel Cron + CRON_SECRET en Authorization Bearer). */
export async function GET(request: NextRequest) {
  try {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
      throw new ApiError({
        code: "FORBIDDEN",
        httpStatus: 503,
        message: "CRON_SECRET no configurado",
      });
    }
    const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (secret !== expected) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Cron no autorizado" });
    }
    const res = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return jsonOk({ deletedSessions: res.count });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
