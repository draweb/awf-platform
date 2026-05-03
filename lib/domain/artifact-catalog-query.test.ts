import { describe, expect, it } from "vitest";
import { ArtifactType } from "@prisma/client";
import {
  buildArtifactCatalogWhere,
  parseArtifactCatalogQueryParams,
} from "./artifact-catalog-query";

function sp(entries: Record<string, string>): URLSearchParams {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(entries)) u.set(k, v);
  return u;
}

describe("parseArtifactCatalogQueryParams", () => {
  it("sin params: sin filtros", () => {
    const r = parseArtifactCatalogQueryParams(new URLSearchParams());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toEqual({ q: null, type: null, status: null, visibility: null });
  });

  it("q de 1 carácter no aplica texto", () => {
    const r = parseArtifactCatalogQueryParams(sp({ q: "a" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.q).toBeNull();
  });

  it("q de 2+ aplica texto", () => {
    const r = parseArtifactCatalogQueryParams(sp({ q: "ab" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.q).toBe("ab");
  });

  it("type skill válido", () => {
    const r = parseArtifactCatalogQueryParams(sp({ type: "skill" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.type).toBe(ArtifactType.skill);
  });

  it("type inválido → error", () => {
    const r = parseArtifactCatalogQueryParams(sp({ type: "no-existe" }));
    expect(r.ok).toBe(false);
  });

  it("status y visibility válidos", () => {
    const r = parseArtifactCatalogQueryParams(sp({ status: "deprecated", visibility: "public" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.status).toBe("deprecated");
    expect(r.value.visibility).toBe("public");
  });
});

describe("buildArtifactCatalogWhere", () => {
  it("vacío → {}", () => {
    expect(
      buildArtifactCatalogWhere({ q: null, type: null, status: null, visibility: null }),
    ).toEqual({});
  });

  it("solo q → OR name/description", () => {
    const w = buildArtifactCatalogWhere({
      q: "foo",
      type: null,
      status: null,
      visibility: null,
    });
    expect(w).toEqual({
      AND: [
        {
          OR: [
            { name: { contains: "foo", mode: "insensitive" } },
            { description: { contains: "foo", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("type + status se combinan con AND", () => {
    const w = buildArtifactCatalogWhere({
      q: null,
      type: ArtifactType.cursor_rule,
      status: "active",
      visibility: null,
    });
    expect(w.AND).toHaveLength(2);
  });
});
