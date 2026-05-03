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
  prisma: { artifact: { findMany: vi.fn() } },
}));

function req(url: string): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

function reader(): Actor {
  return {
    userId: "u1",
    email: "r@x.y",
    role: "consumer",
    authMethod: "session",
    scopes: ["artifact:read"],
    sessionId: "s1",
  };
}

describe("GET /api/v1/artifacts", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
    vi.mocked(prisma.artifact.findMany).mockReset();
  });

  it("401 sin actor", async () => {
    vi.mocked(getActor).mockResolvedValue(null);
    const res = await GET(req("http://localhost/api/v1/artifacts"));
    expect(res.status).toBe(401);
    expect(prisma.artifact.findMany).not.toHaveBeenCalled();
  });

  it("400 con type inválido", async () => {
    vi.mocked(getActor).mockResolvedValue(reader());
    const res = await GET(req("http://localhost/api/v1/artifacts?type=zzz"));
    expect(res.status).toBe(400);
    expect(prisma.artifact.findMany).not.toHaveBeenCalled();
  });

  it("200 y llama findMany con where vacío sin filtros", async () => {
    vi.mocked(getActor).mockResolvedValue(reader());
    vi.mocked(prisma.artifact.findMany).mockResolvedValue([]);
    const res = await GET(req("http://localhost/api/v1/artifacts"));
    expect(res.status).toBe(200);
    expect(prisma.artifact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it("findMany incluye AND cuando hay q y type", async () => {
    vi.mocked(getActor).mockResolvedValue(reader());
    vi.mocked(prisma.artifact.findMany).mockResolvedValue([]);
    const res = await GET(req("http://localhost/api/v1/artifacts?q=awf&type=skill"));
    expect(res.status).toBe(200);
    const arg = vi.mocked(prisma.artifact.findMany).mock.calls[0][0];
    expect(arg.where).toEqual({
      AND: [
        {
          OR: [
            { name: { contains: "awf", mode: "insensitive" } },
            { description: { contains: "awf", mode: "insensitive" } },
          ],
        },
        { type: "skill" },
      ],
    });
  });
});
