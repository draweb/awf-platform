import { describe, expect, it } from "vitest";
import { buildArtifactListSearchParams } from "./build-artifact-list-url";

describe("buildArtifactListSearchParams", () => {
  it("omite q si tiene menos de 2 caracteres", () => {
    const p = buildArtifactListSearchParams({
      debouncedQ: "a",
      type: "",
      status: "",
      visibility: "",
      limit: 50,
    });
    expect(p.has("q")).toBe(false);
  });

  it("incluye q, type, cursor", () => {
    const p = buildArtifactListSearchParams({
      debouncedQ: "ab",
      type: "skill",
      status: "active",
      visibility: "internal",
      limit: 100,
      cursor: "cuid123",
    });
    expect(p.get("q")).toBe("ab");
    expect(p.get("type")).toBe("skill");
    expect(p.get("status")).toBe("active");
    expect(p.get("visibility")).toBe("internal");
    expect(p.get("cursor")).toBe("cuid123");
    expect(p.get("limit")).toBe("100");
  });
});
