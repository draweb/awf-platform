import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canDeprecate } from "@/lib/domain/permissions";
import { writeAudit } from "@/lib/audit/log";
import { decodeArtifactNameParam } from "@/lib/http/decode-artifact-name";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { recomputeLatestDistTagForArtifact } from "@/lib/domain/recompute-latest-dist-tag";

type Ctx = { params: Promise<{ encodedName: string; version: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canDeprecate(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { encodedName, version } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const artifact = await prisma.artifact.findUnique({ where: { name } });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    if (artifact.owner !== actor.userId && actor.role !== "admin" && actor.role !== "maintainer") {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "No autorizado en este artefacto" });
    }
    const row = await prisma.artifactVersion.findUnique({
      where: { artifactId_version: { artifactId: artifact.id, version } },
    });
    if (!row) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Versión no encontrada" });
    }
    const updated = await prisma.artifactVersion.update({
      where: { id: row.id },
      data: { status: "deprecated" },
    });
    await writeAudit({
      actorId: actor.userId,
      action: "version.deprecate",
      entityType: "artifact_version",
      entityId: row.id,
      before: row,
      after: updated,
    });
    await recomputeLatestDistTagForArtifact(artifact.id, actor.userId);
    return jsonOk({ version: updated });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
