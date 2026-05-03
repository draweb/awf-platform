/**
 * Agregación y presentación del payload del dashboard admin (sin I/O).
 * Telemetría CLI vía `InstallEvent`; actividad API vía `AuditLog`.
 */

export type AuditFeedInput = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string;
};

export type InstallFeedInput = {
  id: string;
  createdAt: Date;
  artifactName: string;
  version: string;
  cliVersion: string;
};

export type ActivityFeedLine = {
  id: string;
  kind: "audit" | "install";
  at: string;
  tag: string;
  message: string;
};

export function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const DAY_MS = 86_400_000;

/**
 * Buckets consecutivos en UTC: índice 0 = (dayCount-1) días atrás, último = día calendario de `now`.
 */
export function countInstallsByUtcDayBuckets(
  eventDates: readonly Date[],
  now: Date,
  dayCount: number,
): number[] {
  const buckets = Array.from({ length: dayCount }, () => 0);
  const endDay = utcStartOfDay(now);
  const windowStart = new Date(endDay);
  windowStart.setUTCDate(windowStart.getUTCDate() - (dayCount - 1));

  for (const dt of eventDates) {
    const day = utcStartOfDay(dt);
    const idx = Math.floor((day.getTime() - windowStart.getTime()) / DAY_MS);
    if (idx >= 0 && idx < dayCount) {
      buckets[idx] = (buckets[idx] ?? 0) + 1;
    }
  }
  return buckets;
}

function truncateId(id: string, max = 12): string {
  if (id.length <= max) return id;
  return `${id.slice(0, max)}…`;
}

export function formatAuditFeedMessage(row: AuditFeedInput): string {
  return `${row.action} · ${row.entityType} ${truncateId(row.entityId)}`;
}

export function auditActionTag(action: string): string {
  const short = action.replace(/\./g, "_").toUpperCase();
  return short.length > 12 ? `${short.slice(0, 12)}…` : short;
}

export function topArtifactsFromInstallRows(
  rows: readonly { artifactId: string; artifactName: string }[],
  limit: number,
): Array<{ artifactName: string; count: number }> {
  const m = new Map<string, { artifactName: string; count: number }>();
  for (const r of rows) {
    const cur = m.get(r.artifactId);
    if (cur) cur.count += 1;
    else m.set(r.artifactId, { artifactName: r.artifactName, count: 1 });
  }
  return [...m.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function mergeActivityFeed(
  audit: readonly AuditFeedInput[],
  installs: readonly InstallFeedInput[],
  limit: number,
): ActivityFeedLine[] {
  const rows: ActivityFeedLine[] = [];
  for (const a of audit) {
    rows.push({
      id: `a:${a.id}`,
      kind: "audit",
      at: a.createdAt.toISOString(),
      tag: auditActionTag(a.action),
      message: formatAuditFeedMessage(a),
    });
  }
  for (const i of installs) {
    rows.push({
      id: `i:${i.id}`,
      kind: "install",
      at: i.createdAt.toISOString(),
      tag: "INSTALL",
      message: `install ${i.artifactName}@${i.version} · CLI ${i.cliVersion}`,
    });
  }
  rows.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));
  return rows.slice(0, limit);
}
