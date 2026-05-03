import { describe, expect, it } from "vitest";
import { artifactListRowFromArtifactDetailJson } from "./artifact-list-map";

describe("artifactListRowFromArtifactDetailJson", () => {
  it("null si falta name", () => {
    expect(artifactListRowFromArtifactDetailJson({ id: "1" })).toBeNull();
  });

  it("solo versiones publicadas", () => {
    const row = artifactListRowFromArtifactDetailJson({
      id: "a1",
      name: "@awf/pkg",
      type: "skill",
      status: "active",
      versions: [
        { version: "0.1.0", status: "published" },
        { version: "0.2.0", status: "draft" },
      ],
    });
    expect(row?.versions).toEqual([{ version: "0.1.0" }]);
  });
});
