import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canReadArtifactCatalog } from "@/lib/domain/permissions";
import { maxSatisfying } from "@/lib/domain/semver-resolve";
import { decodeArtifactNameParam } from "@/lib/http/decode-artifact-name";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { clientKeyFromRequest } from "@/lib/rate-limit/login";
import { isUpstashRateLimited } from "@/lib/rate-limit/upstash";

type Ctx = { params: Promise<{ encodedName: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    if (await isUpstashRateLimited(`resolve:${clientKeyFromRequest(request)}`)) {
      throw new ApiError({
        code: "RATE_LIMITED",
        httpStatus: 429,
        message: "Demasiadas consultas de resolución",
      });
    }
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadArtifactCatalog(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin scope artifact:read" });
    }
    const { encodedName } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range");
    const tag = searchParams.get("tag");

    const artifact = await prisma.artifact.findUnique({
      where: { name },
      include: {
        versions: {
          where: { status: { in: ["published", "deprecated"] } },
        },
        distTags: true,
      },
    });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }

    let resolved: string | null = null;
    if (tag) {
      const dt = artifact.distTags.find((d) => d.tag === tag);
      resolved = dt?.version ?? null;
    } else if (range) {
      const versions = artifact.versions.map((v) => v.version);
      try {
        resolved = maxSatisfying(versions, range);
      } catch {
        throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Rango SemVer inválido" });
      }
    } else {
      const latest = artifact.distTags.find((d) => d.tag === "latest");
      resolved = latest?.version ?? null;
    }

    if (!resolved) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "No se pudo resolver versión" });
    }

    const verRow = artifact.versions.find((v) => v.version === resolved);
    if (!verRow) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Versión no publicada" });
    }

    return jsonOk({
      name: artifact.name,
      version: resolved,
      checksumSha256: verRow.checksumSha256,
      tarballUrl: verRow.tarballUrl,
      deprecated: verRow.status === "deprecated",
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
