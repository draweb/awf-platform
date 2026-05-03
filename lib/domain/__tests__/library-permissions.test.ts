import { describe, expect, it } from "vitest";
import { canReadLibrary, canCreateLibrary, canWriteLibrary, canViewLibrary } from "@/lib/domain/permissions";
import type { Actor } from "@/lib/auth/get-actor";

function actor(partial: Partial<Actor> & Pick<Actor, "authMethod" | "role">): Actor {
  return { userId: "u1", email: "a@b.c", scopes: [], ...partial };
}

describe("canReadLibrary", () => {
  it("permits session maintainer+", () => {
    expect(canReadLibrary(actor({ authMethod: "session", role: "maintainer" }))).toBe(true);
    expect(canReadLibrary(actor({ authMethod: "session", role: "admin" }))).toBe(true);
  });
  it("denies session consumer/publisher", () => {
    expect(canReadLibrary(actor({ authMethod: "session", role: "consumer" }))).toBe(false);
    expect(canReadLibrary(actor({ authMethod: "session", role: "publisher" }))).toBe(false);
  });
  it("permits PAT with admin:read or artifact:read", () => {
    expect(canReadLibrary(actor({ authMethod: "pat", role: "admin", scopes: ["admin:read"] }))).toBe(true);
    expect(canReadLibrary(actor({ authMethod: "pat", role: "admin", scopes: ["artifact:read"] }))).toBe(true);
  });
  it("denies PAT without read scopes", () => {
    expect(canReadLibrary(actor({ authMethod: "pat", role: "admin", scopes: ["artifact:write"] }))).toBe(false);
  });
});

describe("canCreateLibrary", () => {
  it("permits session maintainer+", () => {
    expect(canCreateLibrary(actor({ authMethod: "session", role: "maintainer" }))).toBe(true);
  });
  it("denies session consumer", () => {
    expect(canCreateLibrary(actor({ authMethod: "session", role: "consumer" }))).toBe(false);
  });
  it("permits PAT with admin:write", () => {
    expect(canCreateLibrary(actor({ authMethod: "pat", role: "admin", scopes: ["admin:write"] }))).toBe(true);
  });
});

describe("canViewLibrary", () => {
  it("permits owner", () => {
    expect(canViewLibrary(actor({ authMethod: "session", role: "maintainer", userId: "u1" }), { ownerId: "u1" })).toBe(true);
  });
  it("permits admin non-owner", () => {
    expect(canViewLibrary(actor({ authMethod: "session", role: "admin", userId: "u2" }), { ownerId: "u1" })).toBe(true);
  });
  it("denies non-owner non-admin", () => {
    expect(canViewLibrary(actor({ authMethod: "session", role: "maintainer", userId: "u2" }), { ownerId: "u1" })).toBe(false);
  });
  it("PAT requires owner match", () => {
    expect(canViewLibrary(actor({ authMethod: "pat", role: "admin", userId: "u1", scopes: ["admin:read"] }), { ownerId: "u1" })).toBe(true);
    expect(canViewLibrary(actor({ authMethod: "pat", role: "admin", userId: "u2", scopes: ["admin:read"] }), { ownerId: "u1" })).toBe(false);
  });
});

describe("canWriteLibrary", () => {
  it("permits owner", () => {
    expect(canWriteLibrary(actor({ authMethod: "session", role: "maintainer", userId: "u1" }), { ownerId: "u1" })).toBe(true);
  });
  it("permits admin non-owner", () => {
    expect(canWriteLibrary(actor({ authMethod: "session", role: "admin", userId: "u2" }), { ownerId: "u1" })).toBe(true);
  });
  it("denies non-owner non-admin", () => {
    expect(canWriteLibrary(actor({ authMethod: "session", role: "maintainer", userId: "u2" }), { ownerId: "u1" })).toBe(false);
  });
  it("PAT requires admin:write + owner", () => {
    expect(canWriteLibrary(actor({ authMethod: "pat", role: "admin", userId: "u1", scopes: ["admin:write"] }), { ownerId: "u1" })).toBe(true);
    expect(canWriteLibrary(actor({ authMethod: "pat", role: "admin", userId: "u1", scopes: ["artifact:read"] }), { ownerId: "u1" })).toBe(false);
    expect(canWriteLibrary(actor({ authMethod: "pat", role: "admin", userId: "u2", scopes: ["admin:write"] }), { ownerId: "u1" })).toBe(false);
  });
});
