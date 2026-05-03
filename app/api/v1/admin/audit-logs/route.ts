import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canAdminStats } from "@/lib/domain/permissions";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

export async function GET(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canAdminStats(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso admin" });
    }
    const { searchParams } = new URL(request.url);
    const take = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const cursor = searchParams.get("cursor");
    const items = await prisma.auditLog.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });
    let nextCursor: string | null = null;
    let list = items;
    if (items.length > take) {
      nextCursor = items[take - 1]?.id ?? null;
      list = items.slice(0, take);
    }
    return jsonOk({ items: list, nextCursor });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
