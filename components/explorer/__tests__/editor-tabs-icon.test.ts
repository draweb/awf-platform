import { describe, expect, it } from "vitest";
import { tabIconFromTitle } from "../editor-tabs";

describe("tabIconFromTitle", () => {
  it("asigna iconos por extensión", () => {
    expect(tabIconFromTitle("manifest.json")).toBe("data_object");
    expect(tabIconFromTitle("CHANGELOG.md")).toBe("article");
    expect(tabIconFromTitle("meta.yaml")).toBe("assignment");
    expect(tabIconFromTitle("src/foo.mjs")).toBe("code");
    expect(tabIconFromTitle("pkg/index.ts")).toBe("code");
  });

  it("usa heurística en rutas largas", () => {
    expect(tabIconFromTitle("scripts/git-agent-commit-summary.mjs")).toBe("code");
  });
});
