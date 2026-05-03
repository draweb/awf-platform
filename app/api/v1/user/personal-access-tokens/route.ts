import { z } from "zod";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { createPersonalAccessToken } from "@/lib/auth/pat";
import { validatePatInput } from "@/lib/auth/pat-policy";
import { SCOPES } from "@/lib/auth/scopes";
import { writeAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { isPatCreateRateLimited, patCreateRateLimitKey } from "@/lib/rate-limit/pat";

const postSchema = z.object({
  name: z.string().min(1).max(128),
  scopes: z.array(z.string()).min(1),
  /** ISO 8601 o null explícito (sin expiración). Omitido = sin expiración. */
  expiresAt: z.union([z.string().min(1), z.null()]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor || actor.authMethod !== "session") {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Solo sesión de panel" });
    }
    const tokens = await prisma.personalAccessToken.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return jsonOk({ items: tokens, availableScopes: [...SCOPES] });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor || actor.authMethod !== "session") {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Solo sesión de panel" });
    }
    if (actor.role === "consumer") {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Rol insuficiente para emitir PAT" });
    }

    const rlKey = patCreateRateLimitKey(actor.userId, request);
    if (isPatCreateRateLimited(rlKey)) {
      throw new ApiError({
        code: "RATE_LIMITED",
        httpStatus: 429,
        message: "Demasiados tokens creados en poco tiempo; probá en un minuto.",
      });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Body inválido",
        details: parsed.error.flatten(),
      });
    }

    let expiresAtResolved: Date | null = null;
    if (parsed.data.expiresAt === undefined) {
      expiresAtResolved = null;
    } else if (parsed.data.expiresAt === null) {
      expiresAtResolved = null;
    } else {
      const d = new Date(parsed.data.expiresAt);
      if (Number.isNaN(d.getTime())) {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "expiresAt no es una fecha ISO válida." });
      }
      expiresAtResolved = d;
    }

    const policyErr = validatePatInput({
      name: parsed.data.name,
      scopes: parsed.data.scopes,
      expiresAt: expiresAtResolved,
    });
    if (policyErr) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: policyErr });
    }

    const allowed = new Set<string>(SCOPES);
    for (const s of parsed.data.scopes) {
      if (!allowed.has(s)) {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: `Scope desconocido: ${s}` });
      }
    }

    const trimmedName = parsed.data.name.trim();
    const duplicate = await prisma.personalAccessToken.findFirst({
      where: {
        userId: actor.userId,
        name: { equals: trimmedName, mode: "insensitive" },
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

    const { rawToken, record } = await createPersonalAccessToken({
      userId: actor.userId,
      name: trimmedName,
      scopes: parsed.data.scopes,
      expiresAt: expiresAtResolved,
    });

    await writeAudit({
      actorId: actor.userId,
      action: "pat.created",
      entityType: "personal_access_token",
      entityId: record.id,
      after: {
        name: record.name,
        scopes: record.scopes,
        expiresAt: record.expiresAt?.toISOString() ?? null,
        tokenPrefix: record.tokenPrefix,
      },
    });

    return jsonOk({
      token: rawToken,
      id: record.id,
      tokenPrefix: record.tokenPrefix,
      name: record.name,
      scopes: record.scopes,
      createdAt: record.createdAt.toISOString(),
      expiresAt: record.expiresAt?.toISOString() ?? null,
      warning: "Guardá el token ahora; no se vuelve a mostrar completo.",
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
