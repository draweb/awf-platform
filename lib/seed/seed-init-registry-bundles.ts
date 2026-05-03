/**
 * Inserta en Postgres los artefactos base que `awf init` espera del registry local,
 * empaquetados desde `packages/registry-artifacts/` (tarball en disco vía storeTarball).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { PrismaClient } from "@prisma/client";
import { ArtifactStatus, ArtifactType, ArtifactVisibility, VersionStatus } from "@prisma/client";
import * as semver from "semver";
import { parseAwfAssetManifest } from "@awf/manifest-schema";
import { storeTarball } from "@/lib/storage/tarball";
import { packRegistryArtifactDirToBuffer } from "./pack-init-bundle";

function manifestTypeToArtifactType(typeField: string): ArtifactType {
  const t = typeField.trim().toLowerCase();
  if (t === "cursor-rule" || t === "cursor_rule") return ArtifactType.cursor_rule;
  if (t === "skill") return ArtifactType.skill;
  return ArtifactType.skill;
}

function discoverBundleDirs(registryArtifactsRoot: string): string[] {
  const out: string[] = [];
  if (!existsSync(registryArtifactsRoot)) {
    console.warn(
      `[seed] No existe packages/registry-artifacts en ${registryArtifactsRoot}; omitiendo bundles init.`,
    );
    return out;
  }
  for (const sub of ["skills", "rules"]) {
    const p = join(registryArtifactsRoot, sub);
    if (!existsSync(p)) continue;
    for (const name of readdirSync(p)) {
      const d = join(p, name);
      if (statSync(d).isDirectory() && existsSync(join(d, "awf.asset.json"))) {
        out.push(d);
      }
    }
  }
  return out.sort();
}

export async function seedInitRegistryBundles(prisma: PrismaClient, ownerUserId: string): Promise<void> {
  if (process.env.SEED_INIT_REGISTRY_BUNDLES === "0") {
    console.log("Seed: SEED_INIT_REGISTRY_BUNDLES=0 — sin artefactos init del registry.");
    return;
  }

  const here = dirname(fileURLToPath(import.meta.url));
  /** apps/web/lib/seed → raíz del monorepo */
  const repoRoot = join(here, "..", "..", "..", "..");
  const registryArtifactsRoot = join(repoRoot, "packages", "registry-artifacts");
  const dirs = discoverBundleDirs(registryArtifactsRoot);
  if (!dirs.length) return;

  let inserted = 0;
  let skipped = 0;

  for (const dir of dirs) {
    const raw = JSON.parse(readFileSync(join(dir, "awf.asset.json"), "utf8")) as unknown;
    const manifest = parseAwfAssetManifest(raw);
    const artifactType = manifestTypeToArtifactType(manifest.type);

    const artifact = await prisma.artifact.upsert({
      where: { name: manifest.name },
      create: {
        name: manifest.name,
        type: artifactType,
        description: manifest.description ?? manifest.name,
        owner: ownerUserId,
        visibility: ArtifactVisibility.internal,
        status: ArtifactStatus.active,
      },
      update: {
        description: manifest.description ?? manifest.name,
        type: artifactType,
      },
    });

    const existingVersion = await prisma.artifactVersion.findUnique({
      where: {
        artifactId_version: { artifactId: artifact.id, version: manifest.version },
      },
    });

    if (existingVersion) {
      skipped += 1;
      continue;
    }

    const { buf, checksumSha256 } = await packRegistryArtifactDirToBuffer(dir, manifest);
    const storageKey = `${artifact.id}/${manifest.version}.tgz`;
    const { url: tarballUrl, sizeBytes } = await storeTarball(storageKey, buf);

    const manifestForDb = manifest as object;

    await prisma.$transaction(async (tx) => {
      await tx.artifactVersion.create({
        data: {
          artifactId: artifact.id,
          version: manifest.version,
          status: VersionStatus.published,
          manifest: manifestForDb,
          changelog: "Paquete base AWF (seed local)",
          tarballUrl,
          checksumSha256,
          sizeBytes,
          createdBy: ownerUserId,
          publishedBy: ownerUserId,
          publishedAt: new Date(),
        },
      });

      const tagsToUpdate = new Set<string>(["latest"]);
      const currentLatest = await tx.distTag.findUnique({
        where: { artifactId_tag: { artifactId: artifact.id, tag: "latest" } },
      });
      if (currentLatest && semver.lt(manifest.version, currentLatest.version)) {
        tagsToUpdate.delete("latest");
      }
      if (semver.prerelease(manifest.version)) {
        tagsToUpdate.delete("latest");
      }

      for (const tag of tagsToUpdate) {
        await tx.distTag.upsert({
          where: { artifactId_tag: { artifactId: artifact.id, tag } },
          create: {
            artifactId: artifact.id,
            tag,
            version: manifest.version,
            updatedBy: ownerUserId,
          },
          update: { version: manifest.version, updatedBy: ownerUserId },
        });
      }
    });

    inserted += 1;
  }

  console.log(
    `Seed OK: artefactos init registry (${inserted} nuevos, ${skipped} ya publicados) desde packages/registry-artifacts`,
  );
}
