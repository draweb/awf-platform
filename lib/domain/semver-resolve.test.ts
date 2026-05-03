import { describe, expect, it } from "vitest";
import { maxSatisfying } from "./semver-resolve";

describe("maxSatisfying", () => {
  it("resuelve caret", () => {
    expect(maxSatisfying(["1.0.0", "1.2.0", "2.0.0"], "^1.0.0")).toBe("1.2.0");
  });
  it("devuelve null si no hay match", () => {
    expect(maxSatisfying(["2.0.0"], "^1.0.0")).toBe(null);
  });
});
