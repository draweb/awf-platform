import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, passwordStrengthScore, validateNewPasswordRules } from "./password-policy";

describe("validateNewPasswordRules", () => {
  it("rechaza si es corta", () => {
    expect(validateNewPasswordRules("abc", "old")).toMatch(/12/);
  });

  it("rechaza si es igual a la actual", () => {
    const p = "a".repeat(MIN_PASSWORD_LENGTH) + "1";
    expect(validateNewPasswordRules(p, p)).toMatch(/distinta/);
  });

  it("rechaza sin número", () => {
    expect(validateNewPasswordRules("abcdefghijkl", "old")).toMatch(/número/);
  });

  it("rechaza sin letra", () => {
    expect(validateNewPasswordRules("123456789012", "old")).toMatch(/letra/);
  });

  it("acepta válida", () => {
    expect(validateNewPasswordRules("abcdEFGH1234", "old")).toBeNull();
  });
});

describe("passwordStrengthScore", () => {
  it("devuelve 0 para vacío", () => {
    expect(passwordStrengthScore("")).toBe(0);
  });

  it("sube con longitud y variedad", () => {
    expect(passwordStrengthScore("short")).toBeLessThan(passwordStrengthScore("abcdEFGH1234xx!!"));
  });
});
