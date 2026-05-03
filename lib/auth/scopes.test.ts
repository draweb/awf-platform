import { describe, expect, it } from "vitest";
import { hasScope } from "./scopes";

describe("hasScope", () => {
  it("admin:write implica todo", () => {
    expect(hasScope(["admin:write"], "artifact:read")).toBe(true);
  });
  it("requiere scope explícito", () => {
    expect(hasScope(["artifact:read"], "artifact:publish")).toBe(false);
  });
});
