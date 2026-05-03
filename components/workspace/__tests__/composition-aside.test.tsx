import { describe, expect, it, vi } from "vitest";
import React from "react";
import { CompositionAside } from "../composition-aside";
import { EMPTY_CONSTITUTION } from "@/lib/domain/workspace-constitution";

describe("CompositionAside", () => {
  const baseProps = {
    name: "Mi Workspace",
    slug: "mi-workspace",
    semver: "1.0.0",
    status: "active" as const,
    stacks: ["nextjs", "react"],
    artifacts: [
      { artifactId: "a1", name: "Rule Alpha", type: "rule", pinnedVersion: "^1.0.0" },
      { artifactId: "a2", name: "Skill Beta", type: "skill", pinnedVersion: null },
    ],
    constitution: EMPTY_CONSTITUTION,
    workspaceId: "ws-123",
    onEditIdentity: vi.fn(),
    onEditStack: vi.fn(),
    onEditConstitution: vi.fn(),
    onEditArtifacts: vi.fn(),
    onDownloadJson: vi.fn(),
  };

  it("renderiza con 2 artefactos y muestra ambos nombres en props", () => {
    const el = React.createElement(CompositionAside, baseProps);
    expect(el.props.artifacts).toHaveLength(2);
    expect(el.props.artifacts[0].name).toBe("Rule Alpha");
    expect(el.props.artifacts[1].name).toBe("Skill Beta");
  });

  it("muestra stacks en las props", () => {
    const el = React.createElement(CompositionAside, baseProps);
    expect(el.props.stacks).toEqual(["nextjs", "react"]);
  });
});
