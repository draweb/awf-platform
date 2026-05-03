import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActor, requireActor } from "@/lib/auth/get-actor";
import { writeAudit } from "@/lib/audit/log";
import { canReadLibrary, canViewLibrary, canWriteLibrary } from "@/lib/domain/permissions";
import { artifactTypeToApi } from "@/lib/domain/artifact-types";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

const putBodySchema = z.object({
  items: z.array(
    z.object({
      artifactId: z.string().min(1),
      pinnedVersion: z.string().nullable().optional(),
      order: z.number().int().optional(),
    }),
  ),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadLibrary(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { id: libraryId } = await ctx.params;
    const lib = await prisma.artifactLibrary.findUnique({ where: { id: libraryId } });
    if (!lib) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Biblioteca no encontrada" });
    }
    if (!canViewLibrary(actor, lib)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso a esta biblioteca" });
    }
    const items = await prisma.libraryArtifact.findMany({
      where: { libraryId },
      include: { artifact: { select: { id: true, name: true, type: true, description: true } } },
      orderBy: { order: "asc" },
    });
    return jsonOk({
      items: items.map((a) => ({
        artifactId: a.artifact.id,
        name: a.artifact.name,
        type: artifactTypeToApi(a.artifact.type),
        description: a.artifact.description,
        pinnedVersion: a.pinnedVersion,
        order: a.order,
      })),
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  try {
    const actor = requireActor(await getActor(request));
    const { id: libraryId } = await ctx.params;
    const lib = await prisma.artifactLibrary.findUnique({ where: { id: libraryId } });
    if (!lib) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Biblioteca no encontrada" });
    }
    if (!canWriteLibrary(actor, lib)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para editar artefactos" });
    }

    const body = await request.json();
    const parsed = putBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Body inválido", details: parsed.error.flatten() });
    }

    const ids = parsed.data.items.map((i) => i.artifactId);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "artifactId duplicado en items" });
    }

    if (ids.length > 0) {
      const existing = await prisma.artifact.findMany({ where: { id: { in: ids } }, select: { id: true } });
      if (existing.length !== ids.length) {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Uno o más artefactos no existen" });
      }
    }

    const before = await prisma.libraryArtifact.findMany({
      where: { libraryId },
      select: { artifactId: true, pinnedVersion: true, order: true },
    });

    await prisma.$transaction([
      prisma.libraryArtifact.deleteMany({ where: { libraryId } }),
      prisma.libraryArtifact.createMany({
        data: parsed.data.items.map((item, index) => ({
          libraryId,
          artifactId: item.artifactId,
          pinnedVersion: item.pinnedVersion ?? null,
          order: item.order ?? index,
        })),
      }),
    ]);

    const after = await prisma.libraryArtifact.findMany({
      where: { libraryId },
      include: { artifact: { select: { id: true, name: true, type: true, description: true } } },
      orderBy: { order: "asc" },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "library.artifacts.updated",
      entityType: "library",
      entityId: libraryId,
      before,
      after: after.map((a) => ({ artifactId: a.artifactId, pinnedVersion: a.pinnedVersion, order: a.order })),
    });

    return jsonOk({
      items: after.map((a) => ({
        artifactId: a.artifact.id,
        name: a.artifact.name,
        type: artifactTypeToApi(a.artifact.type),
        description: a.artifact.description,
        pinnedVersion: a.pinnedVersion,
        order: a.order,
      })),
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
