import semver from "semver";
import { prisma } from "@/lib/db";

/**
 * After yank/deprecate, point `latest` to the highest published SemVer, or delete the tag if none.
 */
export async function recomputeLatestDistTagForArtifact(artifactId: string, updatedBy: string): Promise<void> {
  const published = await prisma.artifactVersion.findMany({
    where: { artifactId, status: "published" },
    select: { version: true },
  });
  const valid = published.map((r) => r.version).filter((v) => semver.valid(v) !== null);
  if (valid.length === 0) {
    await prisma.distTag.deleteMany({
      where: { artifactId, tag: "latest" },
    });
    return;
  }
  const sorted = semver.rsort(valid);
  const highest = sorted[0]!;
  await prisma.distTag.upsert({
    where: { artifactId_tag: { artifactId, tag: "latest" } },
    create: { artifactId, tag: "latest", version: highest, updatedBy },
    update: { version: highest, updatedBy },
  });
}
