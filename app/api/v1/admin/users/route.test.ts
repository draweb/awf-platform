import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";
import { getActor } from "@/lib/auth/get-actor";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/auth/get-actor";

vi.mock("@/lib/auth/get-actor", () => ({
  getActor: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

function req(url = "http://localhost/api/v1/admin/users"): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

function adminSession(): Actor {
  return {
    userId: "admin1",
    email: "admin@local.dev",
    role: "admin",
    authMethod: "session",
    scopes: [],
    sessionId: "s1",
  };
}

describe("GET /api/v1/admin/users", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
    vi.mocked(prisma.user.findMany).mockReset();
  });

  it("401 si no hay actor", async () => {
    vi.mocked(getActor).mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("403 si el actor no es admin de sesión", async () => {
    vi.mocked(getActor).mockResolvedValue({
      userId: "u1",
      email: "m@x.y",
      role: "maintainer",
      authMethod: "session",
      scopes: [],
    });
    const res = await GET(req());
    expect(res.status).toBe(403);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("403 si el actor es PAT", async () => {
    vi.mocked(getActor).mockResolvedValue({
      userId: "u1",
      email: "m@x.y",
      role: "admin",
      authMethod: "pat",
      scopes: ["admin:read"],
      patId: "p1",
    });
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it("200 y lista items para admin de sesión", async () => {
    vi.mocked(getActor).mockResolvedValue(adminSession());
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: "u1",
        email: "a@b.c",
        name: "A",
        role: "consumer",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-02T00:00:00.000Z"),
      },
    ] as Awaited<ReturnType<typeof prisma.user.findMany>>);

    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items?: unknown[] };
    expect(body.items).toHaveLength(1);
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
  });
});
