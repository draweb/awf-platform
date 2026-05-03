import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canReadArtifactCatalog } from "@/lib/domain/permissions";
import { decodeArtifactNameParam } from "@/lib/http/decode-artifact-name";
import { isLocalTarballUrl, readTarballBytes } from "@/lib/storage/tarball";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonUnexpected } from "@/lib/http/json";

type Ctx = { params: Promise<{ encodedName: string; version: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadArtifactCatalog(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin scope artifact:read" });
    }
    const { encodedName, version } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const artifact = await prisma.artifact.findUnique({
      where: { name },
      include: {
        versions: {
          where: { version, status: { in: ["published", "deprecated"] } },
        },
      },
    });
    const v = artifact?.versions[0];
    if (!artifact || !v) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Versión no encontrada" });
    }
    if (isLocalTarballUrl(v.tarballUrl)) {
      const bytes = await readTarballBytes(v.tarballUrl);
      return new Response(Uint8Array.from(bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(artifact.name)}-${version}.tgz"`,
          "X-Checksum-Sha256": v.checksumSha256,
        },
      });
    }
    return Response.redirect(v.tarballUrl, 302);
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
