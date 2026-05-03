import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canReadArtifactCatalog } from "@/lib/domain/permissions";
import { artifactTypeFromApi, artifactTypeToApi } from "@/lib/domain/artifact-types";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

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
    const q = (searchParams.get("q") ?? "").trim();
    const type = searchParams.get("type");
    if (q.length < 2) {
      return jsonOk({ items: [] });
    }
    const typeFilter = type ? artifactTypeFromApi(type) : undefined;
    const where: Prisma.ArtifactWhereInput = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };
    if (typeFilter) where.type = typeFilter;
    const items = await prisma.artifact.findMany({
      where,
      take: 50,
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({
      items: items.map((a) => ({ ...a, type: artifactTypeToApi(a.type) })),
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
