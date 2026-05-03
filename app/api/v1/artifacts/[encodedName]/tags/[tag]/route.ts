import { z } from "zod";
import type { NextRequest } from "next/server";
import semver from "semver";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canWriteDistTag } from "@/lib/domain/permissions";
import { writeAudit } from "@/lib/audit/log";
import { decodeArtifactNameParam } from "@/lib/http/decode-artifact-name";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

type Ctx = { params: Promise<{ encodedName: string; tag: string }> };

const putBodySchema = z.object({
  version: z.string().min(1),
});

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canWriteDistTag(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para dist-tags" });
    }
    const { encodedName, tag: tagParam } = await ctx.params;
    const tag = decodeURIComponent(tagParam);
    const name = decodeArtifactNameParam(encodedName);
    const body = await request.json();
    const parsed = putBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Body inválido",
        details: parsed.error.flatten(),
      });
    }
    const { version } = parsed.data;
    if (!semver.valid(version)) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Versión SemVer inválida" });
    }
    const artifact = await prisma.artifact.findUnique({ where: { name } });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    if (artifact.owner !== actor.userId && actor.role !== "admin" && actor.role !== "maintainer") {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "No autorizado" });
    }
    const ver = await prisma.artifactVersion.findUnique({
      where: { artifactId_version: { artifactId: artifact.id, version } },
    });
    if (!ver || ver.status !== "published") {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Versión publicada no encontrada" });
    }
    const row = await prisma.distTag.upsert({
      where: { artifactId_tag: { artifactId: artifact.id, tag } },
      create: {
        artifactId: artifact.id,
        tag,
        version,
        updatedBy: actor.userId,
      },
      update: { version, updatedBy: actor.userId },
    });
    await writeAudit({
      actorId: actor.userId,
      action: "tag.put",
      entityType: "dist_tag",
      entityId: row.id,
      after: { tag, version },
    });
    return jsonOk({ tag: row });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canWriteDistTag(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { encodedName, tag: tagParam } = await ctx.params;
    const tag = decodeURIComponent(tagParam);
    const name = decodeArtifactNameParam(encodedName);
    const artifact = await prisma.artifact.findUnique({ where: { name } });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    if (artifact.owner !== actor.userId && actor.role !== "admin") {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "No autorizado" });
    }
    await prisma.distTag.deleteMany({ where: { artifactId: artifact.id, tag } });
    await writeAudit({
      actorId: actor.userId,
      action: "tag.delete",
      entityType: "artifact",
      entityId: artifact.id,
      after: { tag },
    });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
