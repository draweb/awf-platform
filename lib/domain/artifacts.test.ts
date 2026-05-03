import { describe, expect, it } from "vitest";
import { isValidArtifactName } from "./artifacts";

describe("isValidArtifactName", () => {
  it("acepta nombres tipo npm scope", () => {
    expect(isValidArtifactName("@awf/cursor-rules-nextjs")).toBe(true);
    expect(isValidArtifactName("@scope/pkg-name")).toBe(true);
  });
  it("rechaza nombres inválidos", () => {
    expect(isValidArtifactName("no-scope")).toBe(false);
    expect(isValidArtifactName("")).toBe(false);
  });
});
