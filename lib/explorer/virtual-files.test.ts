import { describe, expect, it } from "vitest";
import { buildMetaYaml, stringifyManifest } from "./virtual-files";

describe("virtual-files", () => {
  it("stringifyManifest formatea JSON", () => {
    expect(stringifyManifest({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it("buildMetaYaml incluye dist_tags", () => {
    const y = buildMetaYaml(
      {
        name: "@awf/x",
        type: "skill",
        description: "d",
        status: "active",
        visibility: "public",
        owner: "o",
        distTags: [{ tag: "latest", version: "1.0.0" }],
      },
      {
        version: "1.0.0",
        status: "published",
        checksumSha256: "deadbeef",
        sizeBytes: 100,
        manifest: {},
        changelog: "",
        createdAt: "2020-01-01",
        publishedAt: "2020-01-02",
      },
    );
    expect(y).toContain("name:");
    expect(y).toContain("@awf/x");
    expect(y).toContain("dist_tags:");
    expect(y).toContain("latest:");
  });
});
