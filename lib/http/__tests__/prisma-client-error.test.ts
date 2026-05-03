import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import { prismaClientErrorToApiError } from "../prisma-client-error";

describe("prismaClientErrorToApiError", () => {
  it("maps P2021 to actionable ApiError", () => {
    const e = new Prisma.PrismaClientKnownRequestError("missing table", {
      code: "P2021",
      clientVersion: "test",
      meta: {},
    });
    const mapped = prismaClientErrorToApiError(e, "test");
    expect(mapped).not.toBeNull();
    expect(mapped!.httpStatus).toBe(503);
    expect(mapped!.message).toContain("migraciones");
  });

  it("maps initialization error", () => {
    const e = new PrismaClientInitializationError("can't reach database", "test");
    const mapped = prismaClientErrorToApiError(e, "test");
    expect(mapped).not.toBeNull();
    expect(mapped!.message).toContain("DATABASE_URL");
  });

  it("returns null for unknown errors", () => {
    expect(prismaClientErrorToApiError(new Error("x"), "ctx")).toBeNull();
  });
});
