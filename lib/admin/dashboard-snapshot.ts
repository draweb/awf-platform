import { prisma } from "@/lib/db";
import {
  countInstallsByUtcDayBuckets,
  mergeActivityFeed,
  topArtifactsFromInstallRows,
  type ActivityFeedLine,
} from "@/lib/domain/admin-dashboard";

export type AdminDashboardSnapshot = {
  artifacts: number;
  versions: number;
  libraries: number;
  /** Desglose versiones por estado (suma = `versions`) */
  versionsPublished: number;
  versionsDraftReview: number;
  versionsDeprecatedYanked: number;
  installEvents24h: number;
  installEvents7d: number;
  distinctInstallUsers7d: number;
  installTrend7d: number[];
  recentWorkspaces: Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
  topArtifactsByInstalls7d: Array<{ artifactName: string; count: number }>;
  activityFeed: ActivityFeedLine[];
};

const FEED_AUDIT_TAKE = 40;
const FEED_INSTALL_TAKE = 40;
const FEED_LIMIT = 28;
const WORKSPACE_TAKE = 12;
const TOP_ARTIFACTS = 5;
const TREND_DAYS = 7;

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const now = new Date();
  const since24h = new Date(now.getTime() - 86_400_000);
  const since7d = new Date(now.getTime() - TREND_DAYS * 86_400_000);

  const [
    artifacts,
    versions,
    libraries,
    versionsPublished,
    versionsDraftReview,
    versionsDeprecatedYanked,
    installEvents24h,
    installRows7d,
    recentWorkspaces,
    recentAudits,
    recentInstalls,
  ] = await Promise.all([
    prisma.artifact.count(),
    prisma.artifactVersion.count(),
    prisma.artifactLibrary.count(),
    prisma.artifactVersion.count({ where: { status: "published" } }),
    prisma.artifactVersion.count({
      where: { status: { in: ["draft", "review"] } },
    }),
    prisma.artifactVersion.count({
      where: { status: { in: ["deprecated", "yanked"] } },
    }),
    prisma.installEvent.count({ where: { createdAt: { gte: since24h } } }),
    prisma.installEvent.findMany({
      where: { createdAt: { gte: since7d } },
      select: {
        createdAt: true,
        artifactId: true,
        userId: true,
        artifact: { select: { name: true } },
      },
    }),
    prisma.workspace.findMany({
      take: WORKSPACE_TAKE,
      orderBy: { updatedAt: "desc" },
      select: { id: true, slug: true, name: true, status: true, updatedAt: true },
    }),
    prisma.auditLog.findMany({
      take: FEED_AUDIT_TAKE,
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, action: true, entityType: true, entityId: true },
    }),
    prisma.installEvent.findMany({
      take: FEED_INSTALL_TAKE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        version: true,
        cliVersion: true,
        artifact: { select: { name: true } },
      },
    }),
  ]);

  const installEvents7d = installRows7d.length;
  const distinctUserIds = new Set(installRows7d.map((r) => r.userId));
  const installTrend7d = countInstallsByUtcDayBuckets(
    installRows7d.map((r) => r.createdAt),
    now,
    TREND_DAYS,
  );
  const topArtifactsByInstalls7d = topArtifactsFromInstallRows(
    installRows7d.map((r) => ({
      artifactId: r.artifactId,
      artifactName: r.artifact.name,
    })),
    TOP_ARTIFACTS,
  );

  const activityFeed = mergeActivityFeed(
    recentAudits.map((a) => ({
      id: a.id,
      createdAt: a.createdAt,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
    })),
    recentInstalls.map((i) => ({
      id: i.id,
      createdAt: i.createdAt,
      artifactName: i.artifact.name,
      version: i.version,
      cliVersion: i.cliVersion,
    })),
    FEED_LIMIT,
  );

  return {
    artifacts,
    versions,
    libraries,
    versionsPublished,
    versionsDraftReview,
    versionsDeprecatedYanked,
    installEvents24h,
    installEvents7d,
    distinctInstallUsers7d: distinctUserIds.size,
    installTrend7d,
    recentWorkspaces: recentWorkspaces.map((w) => ({
      id: w.id,
      slug: w.slug,
      name: w.name,
      status: w.status,
      updatedAt: w.updatedAt.toISOString(),
    })),
    topArtifactsByInstalls7d,
    activityFeed,
  };
}
