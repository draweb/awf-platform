import { describe, expect, it } from "vitest";
import {
  isWorkspaceLabelPlaceholder,
  isValidWorkspaceSemver,
  isValidWorkspaceSlug,
  MAX_WORKSPACE_DESCRIPTION_LEN,
  MAX_WORKSPACE_RAW_MARKDOWN_LEN,
  resolveWorkspaceIdentityLabel,
  suggestSlugFromName,
  validateStacks,
  WORKSPACE_SLUG_REGEX,
} from "./workspace-validate";

describe("workspace-validate", () => {
  it("WORKSPACE_SLUG_REGEX", () => {
    expect(WORKSPACE_SLUG_REGEX.test("ab")).toBe(true);
    expect(WORKSPACE_SLUG_REGEX.test("a")).toBe(false);
    expect(WORKSPACE_SLUG_REGEX.test("Mi-Slug")).toBe(false);
  });

  it("isValidWorkspaceSlug", () => {
    expect(isValidWorkspaceSlug("crm-admin")).toBe(true);
    expect(isValidWorkspaceSlug("x")).toBe(false);
  });

  it("isValidWorkspaceSemver", () => {
    expect(isValidWorkspaceSemver("1.0.0")).toBe(true);
    expect(isValidWorkspaceSemver("not-a-version")).toBe(false);
  });

  it("suggestSlugFromName normaliza acentos", () => {
    expect(suggestSlugFromName("Mi Proyecto Á")).toMatch(/mi-proyecto-a/);
  });

  it("validateStacks catálogo", () => {
    expect(validateStacks(["nextjs", "prisma"]).ok).toBe(true);
    expect(validateStacks(["unknown-stack"]).ok).toBe(false);
  });

  it("límites documentados", () => {
    expect(MAX_WORKSPACE_DESCRIPTION_LEN).toBe(1024);
    expect(MAX_WORKSPACE_RAW_MARKDOWN_LEN).toBe(65_536);
  });

  it("isWorkspaceLabelPlaceholder detecta vacíos y solo guiones", () => {
    expect(isWorkspaceLabelPlaceholder("")).toBe(true);
    expect(isWorkspaceLabelPlaceholder("   ")).toBe(true);
    expect(isWorkspaceLabelPlaceholder("---")).toBe(true);
    expect(isWorkspaceLabelPlaceholder("– —")).toBe(true);
    expect(isWorkspaceLabelPlaceholder("Mi nombre")).toBe(false);
  });

  it("resolveWorkspaceIdentityLabel cae del nombre placeholder al slug", () => {
    expect(resolveWorkspaceIdentityLabel("---", "mi-slug")).toBe("mi-slug");
    expect(resolveWorkspaceIdentityLabel("Real", "slug")).toBe("Real");
    expect(resolveWorkspaceIdentityLabel("", "")).toBe("");
  });
});
