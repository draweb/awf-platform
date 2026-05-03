import { describe, expect, it } from "vitest";
import {
  buildWorkspaceMarkdown,
  constitutionSchema,
  EMPTY_CONSTITUTION,
  EXAMPLE_CONSTITUTION,
} from "./workspace-constitution";

describe("workspace-constitution", () => {
  it("buildWorkspaceMarkdown mantiene orden de secciones y omite vacías", () => {
    const c = {
      ...EMPTY_CONSTITUTION,
      identity: { title: "ID", body: "cuerpo", bullets: [] },
      principles: [{ title: "P1", body: "b1", bullets: ["x"] }],
    };
    const md = buildWorkspaceMarkdown(c, { name: "W", slug: "w", semver: "1.0.0" });
    expect(md).toContain("# W");
    expect(md).toContain("slug: `w`");
    expect(md).toContain("## Identidad");
    expect(md).toContain("### ID");
    expect(md).toContain("cuerpo");
    expect(md.indexOf("## Identidad")).toBeLessThan(md.indexOf("## Principios"));
    expect(md).toContain("## Principios");
    expect(md).toContain("- x");
  });

  it("constitutionSchema rechaza tipos inválidos", () => {
    const bad = { ...EMPTY_CONSTITUTION, identity: "nope" };
    expect(constitutionSchema.safeParse(bad).success).toBe(false);
  });

  it("constitutionSchema acepta EMPTY_CONSTITUTION", () => {
    expect(constitutionSchema.safeParse(EMPTY_CONSTITUTION).success).toBe(true);
  });

  it("constitutionSchema acepta EXAMPLE_CONSTITUTION", () => {
    expect(constitutionSchema.safeParse(EXAMPLE_CONSTITUTION).success).toBe(true);
  });

  it("EXAMPLE_CONSTITUTION tiene ejemplos en todas las secciones array", () => {
    expect(EXAMPLE_CONSTITUTION.identity.title.length).toBeGreaterThan(0);
    expect(EXAMPLE_CONSTITUTION.stackContext.title.length).toBeGreaterThan(0);
    expect(EXAMPLE_CONSTITUTION.principles.length).toBeGreaterThanOrEqual(1);
    expect(EXAMPLE_CONSTITUTION.restrictions.length).toBeGreaterThanOrEqual(1);
    expect(EXAMPLE_CONSTITUTION.coding.length).toBeGreaterThanOrEqual(1);
    expect(EXAMPLE_CONSTITUTION.security.length).toBeGreaterThanOrEqual(1);
    expect(EXAMPLE_CONSTITUTION.qualityTesting.length).toBeGreaterThanOrEqual(1);
    expect(EXAMPLE_CONSTITUTION.collaboration.length).toBeGreaterThanOrEqual(1);
    expect(EXAMPLE_CONSTITUTION.glossary.length).toBeGreaterThanOrEqual(1);
  });
});
