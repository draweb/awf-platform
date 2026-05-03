import { z } from "zod";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { validatePatName } from "@/lib/auth/pat-policy";
import { writeAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

const patchSchema = z.object({
  name: z.string().min(1).max(128),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const actor = await getActor(request);
    if (!actor || actor.authMethod !== "session") {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Solo sesión de panel" });
    }

    const existing = await prisma.personalAccessToken.findFirst({
      where: { id, userId: actor.userId },
      select: { id: true, name: true, scopes: true, expiresAt: true, tokenPrefix: true },
    });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Token no encontrado" });
    }

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

    const nameErr = validatePatName(parsed.data.name);
    if (nameErr) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: nameErr });
    }

    const trimmedName = parsed.data.name.trim();
    const duplicate = await prisma.personalAccessToken.findFirst({
      where: {
        userId: actor.userId,
        name: { equals: trimmedName, mode: "insensitive" },
        NOT: { id },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ApiError({
        code: "CONFLICT",
        httpStatus: 409,
        message: "Ya tenés un token con ese nombre.",
      });
    }

    const updated = await prisma.personalAccessToken.update({
      where: { id },
      data: { name: trimmedName },
      select: { id: true, name: true, tokenPrefix: true, scopes: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "pat.renamed",
      entityType: "personal_access_token",
      entityId: id,
      before: { name: existing.name },
      after: { name: updated.name },
    });

    return jsonOk({ item: updated });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const actor = await getActor(request);
    if (!actor || actor.authMethod !== "session") {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Solo sesión de panel" });
    }

    const existing = await prisma.personalAccessToken.findFirst({
      where: { id, userId: actor.userId },
      select: {
        id: true,
        name: true,
        scopes: true,
        expiresAt: true,
        tokenPrefix: true,
        createdAt: true,
      },
    });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Token no encontrado" });
    }

    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "pat.revoked",
          entityType: "personal_access_token",
          entityId: id,
          before: {
            name: existing.name,
            scopes: existing.scopes,
            tokenPrefix: existing.tokenPrefix,
            expiresAt: existing.expiresAt?.toISOString() ?? null,
            createdAt: existing.createdAt.toISOString(),
          },
        },
      }),
      prisma.personalAccessToken.delete({ where: { id } }),
    ]);

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
