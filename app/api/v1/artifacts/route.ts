import { z } from "zod";
import type { NextRequest } from "next/server";
import { ArtifactVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { artifactTypeFromApi } from "@/lib/domain/artifact-types";
import { buildArtifactCatalogWhere, parseArtifactCatalogQueryParams } from "@/lib/domain/artifact-catalog-query";
import { isValidArtifactName } from "@/lib/domain/artifacts";
import { artifactTypeToApi } from "@/lib/domain/artifact-types";
import { canReadArtifactCatalog, canWriteArtifact } from "@/lib/domain/permissions";
import { writeAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

const postSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  visibility: z.enum(["private", "internal", "public"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadArtifactCatalog(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin scope artifact:read" });
    }
    const { searchParams } = new URL(request.url);
    const parsedList = parseArtifactCatalogQueryParams(searchParams);
    if (!parsedList.ok) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: parsedList.message,
      });
    }
    const where = buildArtifactCatalogWhere(parsedList.value);
    const take = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 100);
    const cursor = searchParams.get("cursor");
    const items = await prisma.artifact.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        /** Todas las versiones publicadas (el panel workspace arma el selector de pin). */
        versions: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          select: { version: true },
        },
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
      items: list.map((a) => ({
        ...a,
        type: artifactTypeToApi(a.type),
      })),
      nextCursor,
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canWriteArtifact(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para crear artefactos" });
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
    const { name, type, description, visibility } = parsed.data;
    if (!isValidArtifactName(name)) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Nombre de artefacto inválido" });
    }
    const at = artifactTypeFromApi(type);
    if (!at) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: `Tipo de artefacto desconocido: ${type}` });
    }
    const vis: ArtifactVisibility =
      visibility === "private"
        ? ArtifactVisibility.private
        : visibility === "public"
          ? ArtifactVisibility.public
          : ArtifactVisibility.internal;
    const artifact = await prisma.artifact.create({
      data: {
        name: name.trim(),
        type: at,
        description,
        owner: actor.userId,
        visibility: vis,
      },
    });
    await writeAudit({
      actorId: actor.userId,
      action: "artifact.create",
      entityType: "artifact",
      entityId: artifact.id,
      after: { name: artifact.name, type: artifact.type },
    });
    return jsonOk({ artifact: { ...artifact, type: artifactTypeToApi(artifact.type) } });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(
        new ApiError({ code: "CONFLICT", httpStatus: 409, message: "Ya existe un artefacto con ese nombre" }),
      );
    }
    console.error(e);
    return jsonUnexpected();
  }
}
