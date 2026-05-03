import { z } from "zod";
import type { NextRequest } from "next/server";
import { ArtifactStatus, ArtifactVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { artifactTypeFromApi, artifactTypeToApi } from "@/lib/domain/artifact-types";
import { canReadArtifactCatalog, canWriteArtifact } from "@/lib/domain/permissions";
import { writeAudit } from "@/lib/audit/log";
import { decodeArtifactNameParam } from "@/lib/http/decode-artifact-name";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

const patchSchema = z.object({
  description: z.string().min(1).optional(),
  type: z.string().optional(),
  visibility: z.enum(["private", "internal", "public"]).optional(),
  status: z.enum(["active", "deprecated", "archived"]).optional(),
});

type Ctx = { params: Promise<{ encodedName: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(_request);
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
      include: {
        versions: { orderBy: { createdAt: "desc" } },
        distTags: true,
      },
    });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    const dayMs = 86_400_000;
    const since24h = new Date(Date.now() - dayMs);
    const since7d = new Date(Date.now() - 7 * dayMs);
    const [installEvents24h, installEvents7d, ownerUser] = await Promise.all([
      prisma.installEvent.count({
        where: { artifactId: artifact.id, createdAt: { gte: since24h } },
      }),
      prisma.installEvent.count({
        where: { artifactId: artifact.id, createdAt: { gte: since7d } },
      }),
      prisma.user.findUnique({
        where: { id: artifact.owner },
        select: { email: true },
      }),
    ]);
    return jsonOk({
      ...artifact,
      type: artifactTypeToApi(artifact.type),
      installEvents24h,
      installEvents7d,
      ownerEmail: ownerUser?.email ?? null,
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canWriteArtifact(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { encodedName } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Body inválido",
        details: parsed.error.flatten(),
      });
    }
    const existing = await prisma.artifact.findUnique({ where: { name } });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    if (existing.owner !== actor.userId && actor.role !== "admin" && actor.role !== "maintainer") {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "No sos el owner del artefacto" });
    }
    const data: Prisma.ArtifactUpdateInput = {};
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.visibility !== undefined) {
      data.visibility =
        parsed.data.visibility === "private"
          ? ArtifactVisibility.private
          : parsed.data.visibility === "public"
            ? ArtifactVisibility.public
            : ArtifactVisibility.internal;
    }
    if (parsed.data.status !== undefined) {
      data.status =
        parsed.data.status === "active"
          ? ArtifactStatus.active
          : parsed.data.status === "archived"
            ? ArtifactStatus.archived
            : ArtifactStatus.deprecated;
    }
    if (parsed.data.type !== undefined) {
      const at = artifactTypeFromApi(parsed.data.type);
      if (!at) {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Tipo inválido" });
      }
      data.type = at;
    }
    const before = { ...existing };
    const artifact = await prisma.artifact.update({
      where: { name },
      data,
    });
    await writeAudit({
      actorId: actor.userId,
      action: "artifact.patch",
      entityType: "artifact",
      entityId: artifact.id,
      before,
      after: artifact,
    });
    return jsonOk({ artifact: { ...artifact, type: artifactTypeToApi(artifact.type) } });
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
    if (!canWriteArtifact(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { encodedName } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const existing = await prisma.artifact.findUnique({ where: { name } });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    if (existing.owner !== actor.userId && actor.role !== "admin") {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "No autorizado a borrar" });
    }
    await prisma.artifact.delete({ where: { name } });
    await writeAudit({
      actorId: actor.userId,
      action: "artifact.delete",
      entityType: "artifact",
      entityId: existing.id,
      before: existing,
    });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
