import { describe, expect, it } from "vitest";
import { getAdminSectionTitle } from "./admin-section-title";

describe("getAdminSectionTitle", () => {
  it("Dashboard en /admin", () => {
    expect(getAdminSectionTitle("/admin")).toBe("Dashboard");
  });

  it("Packages en artifacts", () => {
    expect(getAdminSectionTitle("/admin/artifacts")).toBe("Packages");
    expect(getAdminSectionTitle("/admin/artifacts/foo%40bar")).toBe("Packages");
  });

  it("Security en tokens", () => {
    expect(getAdminSectionTitle("/admin/tokens")).toBe("Security");
  });

  it("Workspaces", () => {
    expect(getAdminSectionTitle("/admin/workspaces")).toBe("Workspaces");
    expect(getAdminSectionTitle("/admin/workspaces/abc/edit")).toBe("Workspaces");
  });

  it("Artifact library", () => {
    expect(getAdminSectionTitle("/admin/artifact-library")).toBe("Artifact library");
  });

  it("Perfil", () => {
    expect(getAdminSectionTitle("/admin/profile")).toBe("Perfil");
  });
});
