import type { NextRequest } from "next/server";
import { Prisma, WorkspaceStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActor, requireActor } from "@/lib/auth/get-actor";
import { writeAudit } from "@/lib/audit/log";
import { artifactTypeToApi } from "@/lib/domain/artifact-types";
import {
  canChangeWorkspaceSlug,
  canReadWorkspace,
  canViewWorkspace,
  canWriteWorkspace,
} from "@/lib/domain/permissions";
import { buildWorkspaceMarkdown, constitutionSchema, EMPTY_CONSTITUTION } from "@/lib/domain/workspace-constitution";
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
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { formatZodErrorForApi } from "@/lib/http/zod-api-message";
import { isWorkspaceMutationRateLimited, workspaceMutationRateLimitKey } from "@/lib/rate-limit/workspace";

const patchBodySchema = z.object({
  name: z.string().min(1).max(MAX_WORKSPACE_NAME_LEN).optional(),
  slug: z.string().optional(),
  description: z.string().max(MAX_WORKSPACE_DESCRIPTION_LEN).optional(),
  stacks: z.array(z.string()).optional(),
  constitution: constitutionSchema.optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  semver: z.string().optional(),
  rawMarkdown: z.string().max(MAX_WORKSPACE_RAW_MARKDOWN_LEN).optional(),
  customMarkdown: z.boolean().optional(),
});

function parseStoredConstitution(json: unknown) {
  const p = constitutionSchema.safeParse(json);
  return p.success ? p.data : EMPTY_CONSTITUTION;
}

function serializeWorkspace(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  semver: string;
  status: WorkspaceStatus;
  stacks: string[];
  constitution: unknown;
  rawMarkdown: string;
  customMarkdown: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  artifacts: {
    pinnedVersion: string | null;
    order: number;
    artifact: { id: string; name: string; type: import("@prisma/client").ArtifactType };
  }[];
}) {
  const constitution = parseStoredConstitution(row.constitution);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    semver: row.semver,
    status: row.status,
    stacks: row.stacks,
    constitution,
    rawMarkdown: row.rawMarkdown,
    customMarkdown: row.customMarkdown,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    artifacts: row.artifacts.map((a) => ({
      artifactId: a.artifact.id,
      name: a.artifact.name,
      type: artifactTypeToApi(a.artifact.type),
      pinnedVersion: a.pinnedVersion,
      order: a.order,
    })),
  };
}

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
    const { id } = await ctx.params;
    const row = await prisma.workspace.findUnique({
      where: { id },
      include: {
        artifacts: {
          include: { artifact: { select: { id: true, name: true, type: true } } },
          orderBy: { order: "asc" },
        },
        libraries: {
          include: { library: { select: { id: true, slug: true, name: true, _count: { select: { artifacts: true } } } } },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!row) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Workspace no encontrado" });
    }
    if (!canViewWorkspace(actor, row)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso a este workspace" });
    }
    return jsonOk({
      workspace: {
        ...serializeWorkspace(row),
        linkedLibraries: row.libraries.map((wl) => ({
          libraryId: wl.library.id,
          slug: wl.library.slug,
          name: wl.library.name,
          artifactCount: wl.library._count.artifacts,
          order: wl.order,
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
    if (!canReadWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    if (isWorkspaceMutationRateLimited(workspaceMutationRateLimitKey(actor.userId, request))) {
      throw new ApiError({ code: "RATE_LIMITED", httpStatus: 429, message: "Demasiadas operaciones; probá en un minuto" });
    }
    const { id } = await ctx.params;
    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Workspace no encontrado" });
    }
    if (!canViewWorkspace(actor, existing)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso a este workspace" });
    }
    if (!canWriteWorkspace(actor, existing)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Solo el dueño o un admin puede editar" });
    }

    const body = await request.json();
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      const { message, details } = formatZodErrorForApi(parsed.error);
      console.warn("[PATCH /api/v1/workspaces/:id] validation:", parsed.error.flatten());
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message,
        details,
      });
    }
    const d = parsed.data;

    if (d.stacks) {
      const stacksCheck = validateStacks(d.stacks);
      if (!stacksCheck.ok) {
        throw new ApiError({
          code: "VALIDATION_ERROR",
          httpStatus: 400,
          message: "Stack no permitido",
          details: { invalid: stacksCheck.invalid },
        });
      }
    }

    let nextSlug = existing.slug;
    if (d.slug !== undefined) {
      const trimmed = d.slug.trim();
      if (trimmed !== existing.slug) {
        if (!canChangeWorkspaceSlug(actor)) {
          throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Solo un admin puede cambiar el slug" });
        }
        nextSlug = trimmed || suggestSlugFromName(d.name ?? existing.name);
        if (!isValidWorkspaceSlug(nextSlug)) {
          throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Slug inválido" });
        }
      }
    }

    if (d.semver !== undefined) {
      const v = d.semver.trim();
      if (!isValidWorkspaceSemver(v)) {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "SemVer inválido" });
      }
    }

    const prevConstitution = parseStoredConstitution(existing.constitution);
    const nextConstitution = d.constitution ?? prevConstitution;
    const constitutionParse = constitutionSchema.safeParse(nextConstitution);
    if (!constitutionParse.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "constitution inválida",
        details: constitutionParse.error.flatten(),
      });
    }

    const nextName = d.name?.trim() ?? existing.name;
    const nextSemver = d.semver?.trim() ?? existing.semver;
    const nextStacks = d.stacks ?? existing.stacks;
    const nextStatus = (d.status ?? existing.status) as WorkspaceStatus;
    const nextDescription = d.description !== undefined ? d.description.trim() : existing.description;

    let nextCustom = existing.customMarkdown;
    let nextRaw = existing.rawMarkdown;

    const explicitRaw = d.rawMarkdown !== undefined;
    if (explicitRaw) {
      nextRaw = d.rawMarkdown!.slice(0, MAX_WORKSPACE_RAW_MARKDOWN_LEN);
      nextCustom = true;
    } else if (d.customMarkdown === false) {
      nextCustom = false;
    }
    if (d.customMarkdown === true && !explicitRaw) {
      nextCustom = true;
    }
    if (!nextCustom && !explicitRaw) {
      nextRaw = buildWorkspaceMarkdown(constitutionParse.data, {
        name: nextName,
        slug: nextSlug,
        semver: nextSemver,
      });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: nextName } : {}),
        ...(d.slug !== undefined ? { slug: nextSlug } : {}),
        ...(d.description !== undefined ? { description: nextDescription } : {}),
        ...(d.stacks !== undefined ? { stacks: nextStacks } : {}),
        ...(d.status !== undefined ? { status: nextStatus } : {}),
        ...(d.semver !== undefined ? { semver: nextSemver } : {}),
        ...(d.constitution !== undefined ? { constitution: constitutionParse.data as unknown as Prisma.InputJsonValue } : {}),
        rawMarkdown: nextRaw,
        customMarkdown: nextCustom,
      },
      include: {
        artifacts: {
          include: { artifact: { select: { id: true, name: true, type: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    await writeAudit({
      actorId: actor.userId,
      action: "workspace.updated",
      entityType: "workspace",
      entityId: id,
      before: {
        slug: existing.slug,
        name: existing.name,
        semver: existing.semver,
        status: existing.status,
      },
      after: {
        slug: updated.slug,
        name: updated.name,
        semver: updated.semver,
        status: updated.status,
      },
    });

    return jsonOk({ workspace: serializeWorkspace(updated) });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(new ApiError({ code: "CONFLICT", httpStatus: 409, message: "Ya existe un workspace con ese slug" }));
    }
    console.error(e);
    return jsonUnexpected();
  }
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  try {
    const actor = requireActor(await getActor(request));
    if (!canReadWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    if (isWorkspaceMutationRateLimited(workspaceMutationRateLimitKey(actor.userId, request))) {
      throw new ApiError({ code: "RATE_LIMITED", httpStatus: 429, message: "Demasiadas operaciones; probá en un minuto" });
    }
    const { id } = await ctx.params;
    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Workspace no encontrado" });
    }
    if (!canViewWorkspace(actor, existing)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso" });
    }
    if (!canWriteWorkspace(actor, existing)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Solo el dueño o un admin puede eliminar" });
    }

    await prisma.workspace.delete({ where: { id } });
    await writeAudit({
      actorId: actor.userId,
      action: "workspace.deleted",
      entityType: "workspace",
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
