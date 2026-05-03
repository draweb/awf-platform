import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/auth/get-actor";
import { getActor } from "@/lib/auth/get-actor";
import { canReadWorkspace } from "@/lib/domain/permissions";
import { rankWorkspacesByStacks } from "@/lib/domain/workspace-match";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { formatZodErrorForApi } from "@/lib/http/zod-api-message";

const bodySchema = z.object({
  stacks: z.array(z.string()).default([]),
  limit: z.number().int().min(1).max(50).optional(),
});

function listWhere(actor: Actor): Prisma.WorkspaceWhereInput {
  const base: Prisma.WorkspaceWhereInput = {};
  if (actor.authMethod === "pat" || actor.role !== "admin") {
    base.ownerId = actor.userId;
  }
  return base;
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para matching de workspaces" });
    }

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      const { message, details } = formatZodErrorForApi(parsed.error);
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message,
        details,
      });
    }

    const rows = await prisma.workspace.findMany({
      where: listWhere(actor),
      select: {
        id: true,
        slug: true,
        name: true,
        stacks: true,
        status: true,
      },
    });

    const limit = parsed.data.limit ?? 20;
    const items = rankWorkspacesByStacks(parsed.data.stacks, rows, limit);

    return jsonOk({ items });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error("[POST /api/v1/workspaces/match]", e);
    return jsonUnexpected();
  }
}
