import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/auth/get-actor";
import { getActor, requireActor } from "@/lib/auth/get-actor";
import { writeAudit } from "@/lib/audit/log";
import { canCreateLibrary, canReadLibrary } from "@/lib/domain/permissions";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { formatZodErrorForApi } from "@/lib/http/zod-api-message";
import { prismaClientErrorToApiError } from "@/lib/http/prisma-client-error";
import { isWorkspaceMutationRateLimited, workspaceMutationRateLimitKey } from "@/lib/rate-limit/workspace";

const createBodySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).default(""),
});

function listWhere(actor: Actor): Prisma.ArtifactLibraryWhereInput {
  if (actor.authMethod === "pat" || actor.role !== "admin") {
    return { ownerId: actor.userId };
  }
  return {};
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadLibrary(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { searchParams } = new URL(request.url);
    const take = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 100);
    const cursor = searchParams.get("cursor");
    const q = searchParams.get("q")?.trim();

    const where: Prisma.ArtifactLibraryWhereInput = {
      ...listWhere(actor),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const items = await prisma.artifactLibrary.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        ownerId: true,
        updatedAt: true,
        _count: { select: { artifacts: true } },
      },
    });

    let nextCursor: string | null = null;
    let list = items;
    if (items.length > take) {
      nextCursor = items[take - 1]?.id ?? null;
      list = items.slice(0, take);
    }

    return jsonOk({
      items: list.map((l) => ({
        id: l.id,
        slug: l.slug,
        name: l.name,
        description: l.description,
        ownerId: l.ownerId,
        updatedAt: l.updatedAt.toISOString(),
        artifactCount: l._count.artifacts,
      })),
      nextCursor,
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    const mapped = prismaClientErrorToApiError(e, "GET /api/v1/libraries");
    if (mapped) { console.error("[GET /api/v1/libraries] prisma:", e); return jsonError(mapped); }
    console.error(e);
    return jsonUnexpected();
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireActor(await getActor(request));
    if (!canCreateLibrary(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para crear bibliotecas" });
    }
    if (isWorkspaceMutationRateLimited(workspaceMutationRateLimitKey(actor.userId, request))) {
      throw new ApiError({ code: "RATE_LIMITED", httpStatus: 429, message: "Demasiadas operaciones; probá en un minuto" });
    }

    const body = await request.json();
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      const { message, details } = formatZodErrorForApi(parsed.error);
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message, details });
    }

    const { name, slug, description } = parsed.data;

    const created = await prisma.artifactLibrary.create({
      data: { name: name.trim(), slug, description: description.trim(), ownerId: actor.userId },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "library.created",
      entityType: "library",
      entityId: created.id,
      after: { slug: created.slug, name: created.name },
    });

    return jsonOk({
      library: {
        id: created.id,
        slug: created.slug,
        name: created.name,
        description: created.description,
        ownerId: created.ownerId,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        artifacts: [],
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(new ApiError({ code: "CONFLICT", httpStatus: 409, message: "Ya existe una biblioteca con ese slug" }));
    }
    const mapped = prismaClientErrorToApiError(e, "POST /api/v1/libraries");
    if (mapped) { console.error("[POST /api/v1/libraries] prisma:", e); return jsonError(mapped); }
    console.error(e);
    return jsonUnexpected();
  }
}
