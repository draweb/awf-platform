import { describe, expect, it } from "vitest";
import { hashUserCode, normalizeUserCode } from "./cli-device";

describe("cli-device user code", () => {
  it("normaliza guiones y espacios", () => {
    expect(normalizeUserCode(" ab-12 ")).toBe("AB12");
  });

  it("hashUserCode es estable para el mismo código normalizado", () => {
    expect(hashUserCode("ab-12")).toBe(hashUserCode("AB 12"));
  });
});
