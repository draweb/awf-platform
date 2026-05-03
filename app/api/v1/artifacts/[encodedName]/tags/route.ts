import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canReadArtifactCatalog } from "@/lib/domain/permissions";
import { decodeArtifactNameParam } from "@/lib/http/decode-artifact-name";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

type Ctx = { params: Promise<{ encodedName: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadArtifactCatalog(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin scope artifact:read" });
    }
    const { encodedName } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const artifact = await prisma.artifact.findUnique({
      where: { name },
      include: { distTags: true },
    });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    return jsonOk({ tags: artifact.distTags });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
