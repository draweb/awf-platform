import type { NextRequest } from "next/server";
import semver from "semver";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canPublishVersion, canReadArtifactCatalog } from "@/lib/domain/permissions";
import { writeAudit } from "@/lib/audit/log";
import { decodeArtifactNameParam } from "@/lib/http/decode-artifact-name";
import { storeTarball, sha256Hex } from "@/lib/storage/tarball";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { env } from "@/lib/env";
import { safeParseAwfAssetManifest } from "@awf/manifest-schema";

type Ctx = { params: Promise<{ encodedName: string }> };

const DEFAULT_MAX_TARBALL_BYTES = 50 * 1024 * 1024;

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadArtifactCatalog(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin scope artifact:read" });
    }
    const { encodedName } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const artifact = await prisma.artifact.findUnique({ where: { name } });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    const versions = await prisma.artifactVersion.findMany({
      where: { artifactId: artifact.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        version: true,
        status: true,
        checksumSha256: true,
        sizeBytes: true,
        createdAt: true,
        publishedAt: true,
      },
    });
    return jsonOk({ versions });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canPublishVersion(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso para publicar" });
    }
    const { encodedName } = await ctx.params;
    const name = decodeArtifactNameParam(encodedName);
    const artifact = await prisma.artifact.findUnique({ where: { name } });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    if (artifact.owner !== actor.userId && actor.role !== "admin" && actor.role !== "maintainer") {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "No autorizado en este artefacto" });
    }

    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Se requiere Content-Type multipart/form-data",
      });
    }

    const form = await request.formData();
    const version = String(form.get("version") ?? "").trim();
    const changelog = String(form.get("changelog") ?? "").trim();
    const manifestRaw = form.get("manifest");
    const tarball = form.get("tarball");
    const updateTag = form.get("tag");

    if (!semver.valid(version)) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Versión SemVer inválida" });
    }
    if (!changelog) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "changelog requerido" });
    }
    if (!(tarball instanceof File) || tarball.size === 0) {
      throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Archivo tarball requerido" });
    }

    const maxBytes = env().AWF_MAX_TARBALL_BYTES ?? DEFAULT_MAX_TARBALL_BYTES;
    if (tarball.size > maxBytes) {
      throw new ApiError({
        code: "PAYLOAD_TOO_LARGE",
        httpStatus: 413,
        message: `Tarball demasiado grande (máx. ${maxBytes} bytes). Configurá AWF_MAX_TARBALL_BYTES si necesitás más.`,
      });
    }

    let manifestJson: unknown;
    if (manifestRaw instanceof File) {
      manifestJson = JSON.parse(await manifestRaw.text()) as unknown;
    } else if (typeof manifestRaw === "string") {
      manifestJson = JSON.parse(manifestRaw) as unknown;
    } else {
      throw new ApiError({ code: "MANIFEST_INVALID", httpStatus: 400, message: "manifest inválido" });
    }

    const parsedManifest = safeParseAwfAssetManifest(manifestJson);
    if (!parsedManifest.success) {
      throw new ApiError({
        code: "MANIFEST_INVALID",
        httpStatus: 400,
        message: "Manifest no cumple el schema awf.asset.json",
        details: parsedManifest.error.flatten(),
      });
    }

    if (parsedManifest.data.version !== version) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: `La versión del multipart (${version}) no coincide con manifest.version (${parsedManifest.data.version})`,
      });
    }

    const existing = await prisma.artifactVersion.findUnique({
      where: { artifactId_version: { artifactId: artifact.id, version } },
    });
    if (existing) {
      throw new ApiError({ code: "VERSION_EXISTS", httpStatus: 409, message: "La versión ya existe" });
    }

    const buf = Buffer.from(await tarball.arrayBuffer());
    const checksumSha256 = sha256Hex(buf);
    const storageKey = `${artifact.id}/${version}.tgz`;
    const { url: tarballUrl, sizeBytes } = await storeTarball(storageKey, buf);

    const manifestForDb = parsedManifest.data as object;

    try {
      const row = await prisma.$transaction(async (tx) => {
        const created = await tx.artifactVersion.create({
          data: {
            artifactId: artifact.id,
            version,
            status: "published",
            manifest: manifestForDb,
            changelog,
            tarballUrl,
            checksumSha256,
            sizeBytes,
            createdBy: actor.userId,
            publishedBy: actor.userId,
            publishedAt: new Date(),
          },
        });

        const tagsToUpdate = new Set<string>(["latest"]);
        if (typeof updateTag === "string" && updateTag.trim()) {
          tagsToUpdate.add(updateTag.trim());
        }

        const currentLatest = await tx.distTag.findUnique({
          where: { artifactId_tag: { artifactId: artifact.id, tag: "latest" } },
        });
        if (currentLatest && semver.lt(version, currentLatest.version)) {
          tagsToUpdate.delete("latest");
        }
        if (semver.prerelease(version)) {
          tagsToUpdate.delete("latest");
        }

        for (const tag of tagsToUpdate) {
          await tx.distTag.upsert({
            where: { artifactId_tag: { artifactId: artifact.id, tag } },
            create: {
              artifactId: artifact.id,
              tag,
              version,
              updatedBy: actor.userId,
            },
            update: { version, updatedBy: actor.userId },
          });
        }

        return created;
      });

      await writeAudit({
        actorId: actor.userId,
        action: "version.publish",
        entityType: "artifact_version",
        entityId: row.id,
        after: { version, checksumSha256 },
      });

      return jsonOk({ version: row });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return jsonError(
          new ApiError({ code: "VERSION_EXISTS", httpStatus: 409, message: "La versión ya existe" }),
        );
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    if (e instanceof SyntaxError) {
      return jsonError(
        new ApiError({ code: "MANIFEST_INVALID", httpStatus: 400, message: "JSON de manifest inválido" }),
      );
    }
    console.error(e);
    return jsonUnexpected();
  }
}
