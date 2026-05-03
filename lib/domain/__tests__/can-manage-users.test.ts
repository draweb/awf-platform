import { describe, expect, it } from "vitest";
import { canManageUsers } from "@/lib/domain/permissions";
import type { Actor } from "@/lib/auth/get-actor";

function actor(partial: Partial<Actor> & Pick<Actor, "authMethod" | "role" | "userId" | "email" | "scopes">): Actor {
  return {
    userId: "u1",
    email: "a@b.c",
    scopes: [],
    ...partial,
  };
}

describe("canManageUsers", () => {
  it("permite solo sesión de panel con rol admin", () => {
    expect(
      canManageUsers(
        actor({ authMethod: "session", role: "admin", userId: "u1", email: "a@b.c", scopes: [] }),
      ),
    ).toBe(true);
  });

  it("deniega PAT aunque el usuario sea admin en BD", () => {
    expect(
      canManageUsers(
        actor({
          authMethod: "pat",
          role: "admin",
          userId: "u1",
          email: "a@b.c",
          scopes: ["admin:read"],
        }),
      ),
    ).toBe(false);
  });

  it("deniega sesión mantenedor u otros roles", () => {
    expect(
      canManageUsers(actor({ authMethod: "session", role: "maintainer", userId: "u1", email: "a@b.c", scopes: [] })),
    ).toBe(false);
    expect(
      canManageUsers(actor({ authMethod: "session", role: "consumer", userId: "u1", email: "a@b.c", scopes: [] })),
    ).toBe(false);
  });

  it("deniega cli_session", () => {
    expect(
      canManageUsers(
        actor({
          authMethod: "cli_session",
          role: "admin",
          userId: "u1",
          email: "a@b.c",
          scopes: [],
        }),
      ),
    ).toBe(false);
  });
});
