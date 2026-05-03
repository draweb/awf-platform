import { describe, expect, it } from "vitest";
import { langFromPath } from "../lang-from-path";

describe("langFromPath", () => {
  it("trata .mjs y .cjs como javascript", () => {
    expect(langFromPath("scripts/git-agent-commit-summary.mjs")).toBe("javascript");
    expect(langFromPath("pkg/dist/index.cjs")).toBe("javascript");
  });

  it("extensión en mayúsculas se normaliza", () => {
    expect(langFromPath("README.MD")).toBe("markdown");
  });
});
