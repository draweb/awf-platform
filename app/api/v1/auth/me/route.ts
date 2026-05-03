import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

export async function GET(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "No autenticado" });
    }
    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Usuario no encontrado" });
    }
    return jsonOk({
      user,
      authMethod: actor.authMethod,
      ...(actor.authMethod === "pat" ? { scopes: actor.scopes } : {}),
      ...(actor.authMethod === "cli_session" ? { cliAccessTokenId: actor.cliAccessTokenId } : {}),
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
