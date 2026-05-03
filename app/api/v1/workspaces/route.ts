import type { NextRequest } from "next/server";
import { Prisma, WorkspaceStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/auth/get-actor";
import { getActor, requireActor } from "@/lib/auth/get-actor";
import { writeAudit } from "@/lib/audit/log";
import { canCreateWorkspace, canReadWorkspace } from "@/lib/domain/permissions";
import {
  buildWorkspaceMarkdown,
  constitutionSchema,
  EMPTY_CONSTITUTION,
} from "@/lib/domain/workspace-constitution";
import {
  isValidWorkspaceSemver,
  isValidWorkspaceSlug,
  MAX_WORKSPACE_DESCRIPTION_LEN,
  MAX_WORKSPACE_NAME_LEN,
  MAX_WORKSPACE_RAW_MARKDOWN_LEN,
  suggestSlugFromName,
  validateStacks,
} from "@/lib/domain/workspace-validate";
import { ApiError } from "@/lib/http/errors";
import { prismaClientErrorToApiError } from "@/lib/http/prisma-client-error";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { formatZodErrorForApi } from "@/lib/http/zod-api-message";
import { isWorkspaceMutationRateLimited, workspaceMutationRateLimitKey } from "@/lib/rate-limit/workspace";

const createBodySchema = z.object({
  name: z.string().min(1).max(MAX_WORKSPACE_NAME_LEN),
  slug: z.string().optional(),
  description: z.string().max(MAX_WORKSPACE_DESCRIPTION_LEN).default(""),
  stacks: z.array(z.string()).default([]),
  constitution: constitutionSchema.optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  semver: z.string().optional(),
  rawMarkdown: z.string().max(MAX_WORKSPACE_RAW_MARKDOWN_LEN).optional(),
  customMarkdown: z.boolean().optional(),
});

function listWhere(actor: Actor): Prisma.WorkspaceWhereInput {
  const base: Prisma.WorkspaceWhereInput = {};
  if (actor.authMethod === "pat" || actor.role !== "admin") {
    base.ownerId = actor.userId;
  }
  return base;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para listar workspaces" });
    }
    const { searchParams } = new URL(request.url);
    const take = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 100);
    const cursor = searchParams.get("cursor");
    const status = searchParams.get("status") as WorkspaceStatus | null;
    const q = searchParams.get("q")?.trim();

    const where: Prisma.WorkspaceWhereInput = {
      ...listWhere(actor),
      ...(status && ["draft", "active", "archived"].includes(status) ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const items = await prisma.workspace.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        semver: true,
        status: true,
        stacks: true,
        updatedAt: true,
        ownerId: true,
        _count: { select: { artifacts: true } },
      },
    });

    let nextCursor: string | null = null;
    let list = items;
    if (items.length > take) {
      const last = items[take - 1];
      nextCursor = last?.id ?? null;
      list = items.slice(0, take);
    }

    return jsonOk({
      items: list.map((w) => ({
        id: w.id,
        slug: w.slug,
        name: w.name,
        description: w.description,
        semver: w.semver,
        status: w.status,
        stacks: w.stacks,
        updatedAt: w.updatedAt.toISOString(),
        artifactCount: w._count.artifacts,
        ownerId: w.ownerId,
      })),
      nextCursor,
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    const mapped = prismaClientErrorToApiError(e, "GET /api/v1/workspaces");
    if (mapped) {
      console.error("[GET /api/v1/workspaces] prisma:", e);
      return jsonError(mapped);
    }
    console.error("[GET /api/v1/workspaces]", e);
    return jsonUnexpected();
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireActor(await getActor(request));
    if (!canCreateWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para crear workspaces" });
    }
    if (isWorkspaceMutationRateLimited(workspaceMutationRateLimitKey(actor.userId, request))) {
      throw new ApiError({ code: "RATE_LIMITED", httpStatus: 429, message: "Demasiadas operaciones; probá en un minuto" });
    }

    const body = await request.json();
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      const { message, details } = formatZodErrorForApi(parsed.error);
      console.warn("[POST /api/v1/workspaces] validation:", parsed.error.flatten());
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message,
        details,
      });
    }

    const d = parsed.data;
    const name = d.name.trim();
    const description = d.description.trim();
    const stacks = d.stacks;

    const stacksCheck = validateStacks(stacks);
    if (!stacksCheck.ok) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Stack no permitido",
        details: { invalid: stacksCheck.invalid },
      });
    }

    let slug = d.slug?.trim() || suggestSlugFromName(name);
    if (!isValidWorkspaceSlug(slug)) {
      slug = suggestSlugFromName(name);
      if (!isValidWorkspaceSlug(slug)) {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Slug inválido" });
      }
    }

    const semver = d.semver?.trim() || "0.1.0";
    if (!isValidWorkspaceSemver(semver)) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "SemVer inválido" });
    }

    const constitution = d.constitution ?? EMPTY_CONSTITUTION;
    const constitutionParse = constitutionSchema.safeParse(constitution);
    if (!constitutionParse.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "constitution inválida",
        details: constitutionParse.error.flatten(),
      });
    }

    const explicitRaw = d.rawMarkdown !== undefined;
    const customMarkdown = d.customMarkdown === true || explicitRaw;
    const rawMarkdown = explicitRaw
      ? d.rawMarkdown!.slice(0, MAX_WORKSPACE_RAW_MARKDOWN_LEN)
      : buildWorkspaceMarkdown(constitutionParse.data, { name, slug, semver });

    const wsStatus = (d.status ?? "draft") as WorkspaceStatus;

    const created = await prisma.workspace.create({
      data: {
        slug,
        name,
        description,
        semver,
        status: wsStatus,
        constitution: constitutionParse.data as unknown as Prisma.InputJsonValue,
        rawMarkdown,
        stacks,
        customMarkdown,
        ownerId: actor.userId,
      },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "workspace.created",
      entityType: "workspace",
      entityId: created.id,
      after: { slug: created.slug, name: created.name, status: created.status },
    });

    return jsonOk({
      workspace: {
        id: created.id,
        slug: created.slug,
        name: created.name,
        description: created.description,
        semver: created.semver,
        status: created.status,
        stacks: created.stacks,
        constitution: constitutionParse.data,
        rawMarkdown: created.rawMarkdown,
        customMarkdown: created.customMarkdown,
        ownerId: created.ownerId,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        artifacts: [],
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(new ApiError({ code: "CONFLICT", httpStatus: 409, message: "Ya existe un workspace con ese slug" }));
    }
    const mapped = prismaClientErrorToApiError(e, "POST /api/v1/workspaces");
    if (mapped) {
      console.error("[POST /api/v1/workspaces] prisma:", e);
      return jsonError(mapped);
    }
    console.error("[POST /api/v1/workspaces]", e);
    return jsonUnexpected();
  }
}
