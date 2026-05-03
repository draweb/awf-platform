import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";
import { getActor } from "@/lib/auth/get-actor";
import { getAdminDashboardSnapshot } from "@/lib/admin/dashboard-snapshot";
import type { Actor } from "@/lib/auth/get-actor";

vi.mock("@/lib/auth/get-actor", () => ({
  getActor: vi.fn(),
}));

vi.mock("@/lib/admin/dashboard-snapshot", () => ({
  getAdminDashboardSnapshot: vi.fn(),
}));

function req(url = "http://localhost/api/v1/admin/dashboard"): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

function maintainerSession(): Actor {
  return {
    userId: "m1",
    email: "m@local.dev",
    role: "maintainer",
    authMethod: "session",
    scopes: [],
    sessionId: "s1",
  };
}

describe("GET /api/v1/admin/dashboard", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
    vi.mocked(getAdminDashboardSnapshot).mockReset();
  });

  it("401 si no hay actor", async () => {
    vi.mocked(getActor).mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(getAdminDashboardSnapshot).not.toHaveBeenCalled();
  });

  it("403 si el actor no puede admin stats", async () => {
    vi.mocked(getActor).mockResolvedValue({
      userId: "c1",
      email: "c@x.y",
      role: "consumer",
      authMethod: "session",
      scopes: [],
      sessionId: "s1",
    });
    const res = await GET(req());
    expect(res.status).toBe(403);
    expect(getAdminDashboardSnapshot).not.toHaveBeenCalled();
  });

  it("200 y payload del snapshot para maintainer", async () => {
    vi.mocked(getActor).mockResolvedValue(maintainerSession());
    vi.mocked(getAdminDashboardSnapshot).mockResolvedValue({
      artifacts: 2,
      versions: 5,
      libraries: 1,
      versionsPublished: 4,
      versionsDraftReview: 1,
      versionsDeprecatedYanked: 0,
      installEvents24h: 0,
      installEvents7d: 3,
      distinctInstallUsers7d: 2,
      installTrend7d: [0, 0, 0, 1, 0, 2, 0],
      recentWorkspaces: [
        {
          id: "w1",
          slug: "acme",
          name: "Acme",
          status: "active",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      topArtifactsByInstalls7d: [{ artifactName: "@a/pkg", count: 3 }],
      activityFeed: [
        {
          id: "a:x",
          kind: "audit",
          at: "2026-01-02T00:00:00.000Z",
          tag: "PUBLISH",
          message: "publish · version v1",
        },
      ],
    });

    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { artifacts: number; activityFeed: unknown[] };
    expect(body.artifacts).toBe(2);
    expect(body.activityFeed).toHaveLength(1);
    expect(getAdminDashboardSnapshot).toHaveBeenCalledTimes(1);
  });
});
