import { describe, it, expect } from "vitest";
import { rankWorkspacesByStacks, scoreWorkspaceAgainstStacks } from "./workspace-match.js";

describe("workspace-match", () => {
  const rows = [
    {
      id: "a",
      slug: "fullstack",
      name: "Full",
      stacks: ["nextjs", "typescript"],
      status: "active" as const,
    },
    {
      id: "b",
      slug: "legacy",
      name: "Legacy",
      stacks: ["vue"],
      status: "draft" as const,
    },
  ];

  it("prioriza intersección de stacks y estado active", () => {
    const ranked = rankWorkspacesByStacks(["nextjs", "typescript"], rows, 10);
    expect(ranked[0]?.workspaceId).toBe("a");
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
  });

  it("scoreWorkspaceAgainstStacks lista razones", () => {
    const s = scoreWorkspaceAgainstStacks(["typescript"], rows[0]!);
    expect(s.reasons.length).toBeGreaterThan(0);
    expect(s.score).toBeGreaterThan(0);
  });
});
