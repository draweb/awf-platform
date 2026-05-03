/**
 * Empaqueta un directorio de packages/registry-artifacts/* igual que `awf pack`
 * (estructura npm `package/`). Usado solo desde seed local.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join, resolve as pathResolve, sep } from "path";
import { tmpdir } from "os";
import * as tar from "tar";
import ignore from "ignore";
import type { AwfAssetManifest } from "@awf/manifest-schema";

function assertUnderRoot(root: string, candidate: string): string {
  const r = pathResolve(root);
  const c = pathResolve(candidate);
  if (!c.startsWith(r + sep) && c !== r) {
    throw new Error(`Ruta fuera del paquete: ${candidate}`);
  }
  return c;
}

function loadGitignore(assetRoot: string): ignore.Ignore {
  const ig = ignore();
  const gi = join(assetRoot, ".gitignore");
  if (existsSync(gi)) {
    ig.add(readFileSync(gi, "utf8"));
  }
  ig.add([".git/**", ".awf/**", "node_modules/**"]);
  return ig;
}

export async function packRegistryArtifactDirToBuffer(
  assetRoot: string,
  manifest: AwfAssetManifest,
): Promise<{ buf: Buffer; checksumSha256: string }> {
  if (!manifest.install?.files?.length) {
    throw new Error("install.files es obligatorio");
  }

  const staging = mkdtempSync(join(tmpdir(), "awf-seed-pack-"));
  const pkgDir = join(staging, "package");
  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(join(pkgDir, "awf.asset.json"), JSON.stringify(manifest, null, 2), "utf8");

  const ig = loadGitignore(assetRoot);

  for (const entry of manifest.install.files) {
    const fromAbs = assertUnderRoot(assetRoot, join(assetRoot, entry.from));
    if (!existsSync(fromAbs)) {
      throw new Error(`Archivo ausente: ${entry.from} en ${assetRoot}`);
    }
    const relFromAsset = entry.from.replace(/^\.\//, "");
    if (ig.ignores(relFromAsset)) {
      throw new Error(`Archivo ignorado no debe estar en install.files: ${entry.from}`);
    }
    const dest = join(pkgDir, ...entry.from.split(/[/\\]/).filter(Boolean));
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(fromAbs, dest);
  }

  const outPath = join(staging, "out.tgz");
  await tar.create(
    {
      cwd: staging,
      file: outPath,
      gzip: true,
      portable: true,
      mtime: new Date("1985-10-26T08:15:00Z"),
    },
    ["package"],
  );

  const buf = readFileSync(outPath);
  rmSync(staging, { recursive: true, force: true });

  const { createHash } = await import("crypto");
  const checksumSha256 = createHash("sha256").update(buf).digest("hex");
  return { buf, checksumSha256 };
}
