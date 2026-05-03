import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActor, requireActor } from "@/lib/auth/get-actor";
import { writeAudit } from "@/lib/audit/log";
import { canReadWorkspace, canViewWorkspace, canWriteWorkspace } from "@/lib/domain/permissions";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { isWorkspaceMutationRateLimited, workspaceMutationRateLimitKey } from "@/lib/rate-limit/workspace";

const putBodySchema = z.object({
  items: z.array(
    z.object({
      libraryId: z.string().min(1),
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
    if (!canReadWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { id: workspaceId } = await ctx.params;
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Workspace no encontrado" });
    }
    if (!canViewWorkspace(actor, workspace)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso" });
    }

    const links = await prisma.workspaceLibrary.findMany({
      where: { workspaceId },
      include: {
        library: {
          select: { id: true, slug: true, name: true, _count: { select: { artifacts: true } } },
        },
      },
      orderBy: { order: "asc" },
    });

    return jsonOk({
      items: links.map((l) => ({
        libraryId: l.library.id,
        slug: l.library.slug,
        name: l.library.name,
        artifactCount: l.library._count.artifacts,
        order: l.order,
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
    if (!canReadWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    if (isWorkspaceMutationRateLimited(workspaceMutationRateLimitKey(actor.userId, request))) {
      throw new ApiError({ code: "RATE_LIMITED", httpStatus: 429, message: "Demasiadas operaciones; probá en un minuto" });
    }
    const { id: workspaceId } = await ctx.params;
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Workspace no encontrado" });
    }
    if (!canViewWorkspace(actor, workspace)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso" });
    }
    if (!canWriteWorkspace(actor, workspace)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para editar bibliotecas" });
    }

    const body = await request.json();
    const parsed = putBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Body inválido", details: parsed.error.flatten() });
    }

    const ids = parsed.data.items.map((i) => i.libraryId);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "libraryId duplicado en items" });
    }

    if (ids.length > 0) {
      const existing = await prisma.artifactLibrary.findMany({ where: { id: { in: ids } }, select: { id: true } });
      if (existing.length !== ids.length) {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Una o más bibliotecas no existen" });
      }
    }

    const before = await prisma.workspaceLibrary.findMany({
      where: { workspaceId },
      select: { libraryId: true, order: true },
    });

    await prisma.$transaction([
      prisma.workspaceLibrary.deleteMany({ where: { workspaceId } }),
      prisma.workspaceLibrary.createMany({
        data: parsed.data.items.map((item, index) => ({
          workspaceId,
          libraryId: item.libraryId,
          order: item.order ?? index,
        })),
      }),
    ]);

    const after = await prisma.workspaceLibrary.findMany({
      where: { workspaceId },
      include: {
        library: { select: { id: true, slug: true, name: true, _count: { select: { artifacts: true } } } },
      },
      orderBy: { order: "asc" },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "workspace.libraries.updated",
      entityType: "workspace",
      entityId: workspaceId,
      before,
      after: after.map((l) => ({ libraryId: l.libraryId, order: l.order })),
    });

    return jsonOk({
      items: after.map((l) => ({
        libraryId: l.library.id,
        slug: l.library.slug,
        name: l.library.name,
        artifactCount: l.library._count.artifacts,
        order: l.order,
      })),
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
