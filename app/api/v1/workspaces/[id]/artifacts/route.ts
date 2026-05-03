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
      artifactId: z.string().min(1),
      pinnedVersion: z.string().nullable().optional(),
      order: z.number().int().optional(),
    }),
  ),
});

type RouteCtx = { params: Promise<{ id: string }> };

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
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para editar artefactos" });
    }

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

    const ids = parsed.data.items.map((i) => i.artifactId);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "artifactId duplicado en items" });
    }

    const artifacts = await prisma.artifact.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (artifacts.length !== ids.length) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Uno o más artefactos no existen" });
    }

    const before = await prisma.workspaceArtifact.findMany({
      where: { workspaceId },
      select: { artifactId: true, pinnedVersion: true, order: true },
    });

    await prisma.$transaction([
      prisma.workspaceArtifact.deleteMany({ where: { workspaceId } }),
      prisma.workspaceArtifact.createMany({
        data: parsed.data.items.map((item, index) => ({
          workspaceId,
          artifactId: item.artifactId,
          pinnedVersion: item.pinnedVersion ?? null,
          order: item.order ?? index,
        })),
      }),
    ]);

    const after = await prisma.workspaceArtifact.findMany({
      where: { workspaceId },
      select: { artifactId: true, pinnedVersion: true, order: true },
      orderBy: { order: "asc" },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "workspace.artifacts.updated",
      entityType: "workspace",
      entityId: workspaceId,
      before,
      after,
    });

    return jsonOk({ items: after });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
