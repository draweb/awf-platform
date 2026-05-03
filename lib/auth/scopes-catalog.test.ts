import { describe, expect, it } from "vitest";
import { SCOPES } from "./scopes";
import { SCOPE_DESCRIPTIONS, assertScopeCatalogComplete } from "./scopes-catalog";

describe("SCOPE_DESCRIPTIONS", () => {
  it("cubre todos los SCOPES", () => {
    assertScopeCatalogComplete();
    for (const s of SCOPES) {
      expect(SCOPE_DESCRIPTIONS[s]).toBeDefined();
      expect(SCOPE_DESCRIPTIONS[s].label.length).toBeGreaterThan(0);
      expect(SCOPE_DESCRIPTIONS[s].description.length).toBeGreaterThan(0);
    }
  });

  it("marca admin:write como peligroso", () => {
    expect(SCOPE_DESCRIPTIONS["admin:write"].danger).toBe(true);
  });
});
