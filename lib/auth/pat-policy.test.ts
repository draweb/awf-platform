import { describe, expect, it } from "vitest";
import {
  addDays,
  expiryFromPresetDays,
  validatePatInput,
  validatePatName,
} from "./pat-policy";

describe("validatePatName", () => {
  it("rechaza vacío", () => {
    expect(validatePatName("   ")).toMatch(/128/);
  });

  it("acepta nombre válido", () => {
    expect(validatePatName("Mi CLI")).toBeNull();
  });
});

describe("validatePatInput", () => {
  it("rechaza sin scopes", () => {
    expect(
      validatePatInput({
        name: "x",
        scopes: [],
        expiresAt: null,
      }),
    ).toMatch(/scope/);
  });

  it("rechaza scope desconocido", () => {
    expect(
      validatePatInput({
        name: "x",
        scopes: ["artifact:read", "evil"],
        expiresAt: null,
      }),
    ).toMatch(/desconocido/);
  });

  it("rechaza expiración en el pasado", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(
      validatePatInput({
        name: "x",
        scopes: ["artifact:read"],
        expiresAt: past,
      }),
    ).toMatch(/futuro/);
  });

  it("acepta válido sin expiración", () => {
    expect(
      validatePatInput({
        name: "CLI",
        scopes: ["artifact:read"],
        expiresAt: null,
      }),
    ).toBeNull();
  });

  it("acepta expiración futura", () => {
    const future = new Date(Date.now() + 86_400_000 * 40);
    expect(
      validatePatInput({
        name: "CLI",
        scopes: ["artifact:read"],
        expiresAt: future,
      }),
    ).toBeNull();
  });
});

describe("addDays / expiryFromPresetDays", () => {
  it("addDays suma días en UTC", () => {
    const base = new Date(Date.UTC(2026, 0, 1));
    const out = addDays(base, 30);
    expect(out.getUTCDate()).toBe(31);
  });

  it("expiryFromPresetDays genera fecha futura", () => {
    const now = new Date("2026-05-01T12:00:00.000Z");
    const d = expiryFromPresetDays(30, now);
    expect(d.getTime()).toBeGreaterThan(now.getTime());
  });
});
