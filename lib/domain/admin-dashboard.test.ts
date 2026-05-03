import { describe, expect, it } from "vitest";
import {
  auditActionTag,
  countInstallsByUtcDayBuckets,
  formatAuditFeedMessage,
  mergeActivityFeed,
  topArtifactsFromInstallRows,
  utcStartOfDay,
} from "./admin-dashboard";

describe("utcStartOfDay", () => {
  it("normaliza a medianoche UTC", () => {
    const d = new Date("2026-05-03T15:30:45.000Z");
    const s = utcStartOfDay(d);
    expect(s.toISOString()).toBe("2026-05-03T00:00:00.000Z");
  });
});

describe("countInstallsByUtcDayBuckets", () => {
  it("distribuye eventos en 7 días (ventana fija desde now)", () => {
    const now = new Date("2026-05-10T12:00:00.000Z");
    const dates = [
      new Date("2026-05-04T10:00:00.000Z"),
      new Date("2026-05-04T22:00:00.000Z"),
      new Date("2026-05-10T01:00:00.000Z"),
    ];
    const buckets = countInstallsByUtcDayBuckets(dates, now, 7);
    expect(buckets).toHaveLength(7);
    expect(buckets[0]).toBe(2);
    expect(buckets[6]).toBe(1);
    expect(buckets.slice(1, 6).every((n) => n === 0)).toBe(true);
  });

  it("ignora fechas fuera de la ventana", () => {
    const now = new Date("2026-05-10T12:00:00.000Z");
    const dates = [new Date("2026-04-01T00:00:00.000Z")];
    const buckets = countInstallsByUtcDayBuckets(dates, now, 7);
    expect(buckets.every((n) => n === 0)).toBe(true);
  });
});

describe("mergeActivityFeed", () => {
  it("ordena por tiempo descendente y respeta limit", () => {
    const audit = [
      {
        id: "a1",
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
        action: "x.y",
        entityType: "artifact",
        entityId: "id1",
      },
      {
        id: "a2",
        createdAt: new Date("2026-01-03T10:00:00.000Z"),
        action: "z",
        entityType: "user",
        entityId: "id2",
      },
    ];
    const installs = [
      {
        id: "i1",
        createdAt: new Date("2026-01-02T10:00:00.000Z"),
        artifactName: "@acme/pkg",
        version: "1.0.0",
        cliVersion: "0.2.0",
      },
    ];
    const merged = mergeActivityFeed(audit, installs, 2);
    expect(merged).toHaveLength(2);
    expect(merged[0]?.kind).toBe("audit");
    expect(merged[0]?.id).toBe("a:a2");
    expect(merged[1]?.kind).toBe("install");
  });
});

describe("formatAuditFeedMessage", () => {
  it("incluye acción y entidad", () => {
    const msg = formatAuditFeedMessage({
      id: "1",
      createdAt: new Date(),
      action: "publish",
      entityType: "version",
      entityId: "verylongidentifierhere",
    });
    expect(msg).toContain("publish");
    expect(msg).toContain("version");
  });
});

describe("topArtifactsFromInstallRows", () => {
  it("agrupa por artefacto y ordena por count", () => {
    const top = topArtifactsFromInstallRows(
      [
        { artifactId: "a1", artifactName: "@x/one" },
        { artifactId: "a2", artifactName: "@y/two" },
        { artifactId: "a1", artifactName: "@x/one" },
        { artifactId: "a1", artifactName: "@x/one" },
      ],
      2,
    );
    expect(top).toEqual([
      { artifactName: "@x/one", count: 3 },
      { artifactName: "@y/two", count: 1 },
    ]);
  });
});

describe("auditActionTag", () => {
  it("acorta tags largos", () => {
    expect(auditActionTag("install_event.create")).toContain("INSTALL");
  });
});
