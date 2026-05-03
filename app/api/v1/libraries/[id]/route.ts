import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActor, requireActor } from "@/lib/auth/get-actor";
import { writeAudit } from "@/lib/audit/log";
import { canReadLibrary, canViewLibrary, canWriteLibrary } from "@/lib/domain/permissions";
import { artifactTypeToApi } from "@/lib/domain/artifact-types";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { formatZodErrorForApi } from "@/lib/http/zod-api-message";

const patchBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().max(500).optional(),
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
    const { id } = await ctx.params;
    const row = await prisma.artifactLibrary.findUnique({
      where: { id },
      include: {
        artifacts: {
          include: { artifact: { select: { id: true, name: true, type: true, description: true } } },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!row) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Biblioteca no encontrada" });
    }
    if (!canViewLibrary(actor, row)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso a esta biblioteca" });
    }
    return jsonOk({
      library: {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        ownerId: row.ownerId,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        artifacts: row.artifacts.map((a) => ({
          artifactId: a.artifact.id,
          name: a.artifact.name,
          type: artifactTypeToApi(a.artifact.type),
          description: a.artifact.description,
          pinnedVersion: a.pinnedVersion,
          order: a.order,
        })),
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  try {
    const actor = requireActor(await getActor(request));
    const { id } = await ctx.params;
    const existing = await prisma.artifactLibrary.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Biblioteca no encontrada" });
    }
    if (!canWriteLibrary(actor, existing)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para editar" });
    }

    const body = await request.json();
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      const { message, details } = formatZodErrorForApi(parsed.error);
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message, details });
    }

    const d = parsed.data;
    const updated = await prisma.artifactLibrary.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name.trim() } : {}),
        ...(d.slug !== undefined ? { slug: d.slug } : {}),
        ...(d.description !== undefined ? { description: d.description.trim() } : {}),
      },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "library.updated",
      entityType: "library",
      entityId: id,
      before: { slug: existing.slug, name: existing.name },
      after: { slug: updated.slug, name: updated.name },
    });

    return jsonOk({
      library: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        description: updated.description,
        ownerId: updated.ownerId,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(new ApiError({ code: "CONFLICT", httpStatus: 409, message: "Ya existe una biblioteca con ese slug" }));
    }
    console.error(e);
    return jsonUnexpected();
  }
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  try {
    const actor = requireActor(await getActor(request));
    const { id } = await ctx.params;
    const existing = await prisma.artifactLibrary.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Biblioteca no encontrada" });
    }
    if (!canWriteLibrary(actor, existing)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para eliminar" });
    }

    await prisma.artifactLibrary.delete({ where: { id } });
    await writeAudit({
      actorId: actor.userId,
      action: "library.deleted",
      entityType: "library",
      entityId: id,
      before: { slug: existing.slug, name: existing.name },
    });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
