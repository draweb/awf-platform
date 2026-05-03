import { describe, expect, it } from "vitest";
import {
  resolveMergedWorkspaceArtifacts,
  type MergeInputDirect,
  type MergeInputLibrary,
} from "./library-merge";

describe("resolveMergedWorkspaceArtifacts", () => {
  it("returns empty when no artifacts and no libraries", () => {
    expect(resolveMergedWorkspaceArtifacts([], [])).toEqual([]);
  });

  it("returns only direct artifacts when no libraries", () => {
    const direct: MergeInputDirect[] = [
      { artifactId: "a1", pinnedVersion: "1.0.0", order: 0, artifactName: "@awf/rule-a" },
      { artifactId: "a2", pinnedVersion: null, order: 1, artifactName: "@awf/rule-b" },
    ];
    const result = resolveMergedWorkspaceArtifacts(direct, []);
    expect(result).toEqual([
      { artifactId: "a1", pinnedVersion: "1.0.0", artifactName: "@awf/rule-a" },
      { artifactId: "a2", pinnedVersion: null, artifactName: "@awf/rule-b" },
    ]);
  });

  it("returns only library artifacts when no directs", () => {
    const libs: MergeInputLibrary[] = [
      {
        libraryOrder: 0,
        artifacts: [
          { artifactId: "a1", pinnedVersion: "2.0.0", order: 0, artifactName: "@awf/skill-x" },
        ],
      },
    ];
    const result = resolveMergedWorkspaceArtifacts([], libs);
    expect(result).toEqual([
      { artifactId: "a1", pinnedVersion: "2.0.0", artifactName: "@awf/skill-x" },
    ]);
  });

  it("direct artifact wins over library artifact with same artifactId", () => {
    const direct: MergeInputDirect[] = [
      { artifactId: "a1", pinnedVersion: "1.0.0", order: 0, artifactName: "@awf/rule-a" },
    ];
    const libs: MergeInputLibrary[] = [
      {
        libraryOrder: 0,
        artifacts: [
          { artifactId: "a1", pinnedVersion: "2.0.0", order: 0, artifactName: "@awf/rule-a" },
          { artifactId: "a2", pinnedVersion: null, order: 1, artifactName: "@awf/rule-b" },
        ],
      },
    ];
    const result = resolveMergedWorkspaceArtifacts(direct, libs);
    expect(result).toEqual([
      { artifactId: "a1", pinnedVersion: "1.0.0", artifactName: "@awf/rule-a" },
      { artifactId: "a2", pinnedVersion: null, artifactName: "@awf/rule-b" },
    ]);
  });

  it("first library wins when same artifact appears in two libraries", () => {
    const libs: MergeInputLibrary[] = [
      {
        libraryOrder: 0,
        artifacts: [
          { artifactId: "a1", pinnedVersion: "1.0.0", order: 0, artifactName: "@awf/rule-a" },
        ],
      },
      {
        libraryOrder: 1,
        artifacts: [
          { artifactId: "a1", pinnedVersion: "3.0.0", order: 0, artifactName: "@awf/rule-a" },
          { artifactId: "a2", pinnedVersion: null, order: 1, artifactName: "@awf/rule-b" },
        ],
      },
    ];
    const result = resolveMergedWorkspaceArtifacts([], libs);
    expect(result).toEqual([
      { artifactId: "a1", pinnedVersion: "1.0.0", artifactName: "@awf/rule-a" },
      { artifactId: "a2", pinnedVersion: null, artifactName: "@awf/rule-b" },
    ]);
  });

  it("respects order within direct artifacts", () => {
    const direct: MergeInputDirect[] = [
      { artifactId: "a2", pinnedVersion: null, order: 5, artifactName: "@awf/b" },
      { artifactId: "a1", pinnedVersion: null, order: 1, artifactName: "@awf/a" },
    ];
    const result = resolveMergedWorkspaceArtifacts(direct, []);
    expect(result.map((r) => r.artifactId)).toEqual(["a1", "a2"]);
  });

  it("deduplicates direct artifacts with same artifactId (first wins)", () => {
    const direct: MergeInputDirect[] = [
      { artifactId: "a1", pinnedVersion: "1.0.0", order: 0, artifactName: "@awf/rule-a" },
      { artifactId: "a1", pinnedVersion: "2.0.0", order: 1, artifactName: "@awf/rule-a-dup" },
    ];
    const result = resolveMergedWorkspaceArtifacts(direct, []);
    expect(result).toHaveLength(1);
    expect(result[0]!.pinnedVersion).toBe("1.0.0");
  });

  it("handles mixed directs + multiple libs with full overlap", () => {
    const direct: MergeInputDirect[] = [
      { artifactId: "a3", pinnedVersion: "3.0.0", order: 0, artifactName: "@awf/c" },
    ];
    const libs: MergeInputLibrary[] = [
      {
        libraryOrder: 0,
        artifacts: [
          { artifactId: "a1", pinnedVersion: null, order: 0, artifactName: "@awf/a" },
          { artifactId: "a3", pinnedVersion: null, order: 1, artifactName: "@awf/c" },
        ],
      },
      {
        libraryOrder: 1,
        artifacts: [
          { artifactId: "a1", pinnedVersion: "9.0.0", order: 0, artifactName: "@awf/a" },
          { artifactId: "a2", pinnedVersion: null, order: 1, artifactName: "@awf/b" },
        ],
      },
    ];
    const result = resolveMergedWorkspaceArtifacts(direct, libs);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.artifactId)).toEqual(["a3", "a1", "a2"]);
    expect(result[0]!.pinnedVersion).toBe("3.0.0");
    expect(result[1]!.pinnedVersion).toBeNull();
  });

  it("respects library order (higher-order library appends after lower)", () => {
    const libs: MergeInputLibrary[] = [
      {
        libraryOrder: 2,
        artifacts: [{ artifactId: "a2", pinnedVersion: null, order: 0, artifactName: "@awf/b" }],
      },
      {
        libraryOrder: 0,
        artifacts: [{ artifactId: "a1", pinnedVersion: null, order: 0, artifactName: "@awf/a" }],
      },
    ];
    const result = resolveMergedWorkspaceArtifacts([], libs);
    expect(result.map((r) => r.artifactId)).toEqual(["a1", "a2"]);
  });
});
