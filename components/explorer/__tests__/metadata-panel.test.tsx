import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MetadataPanel, type ArtifactDetailForPanel } from "../metadata-panel";

const noop = () => Promise.resolve();

function detailWithVersion(status: "draft" | "published"): ArtifactDetailForPanel {
  return {
    name: "@scope/pkg",
    type: "skill",
    description: "d",
    status: "active",
    visibility: "internal",
    owner: "u1",
    versions: [{ id: "v1", version: "1.0.0", status, checksumSha256: "x", sizeBytes: 10 }],
    distTags: [{ tag: "latest", version: "1.0.0" }],
  };
}

describe("MetadataPanel acciones", () => {
  it("muestra Despublicar y Deprecar cuando la versión seleccionada está published", () => {
    const html = renderToStaticMarkup(
      createElement(MetadataPanel, {
        detail: detailWithVersion("published"),
        selectedVersion: "1.0.0",
        onVersionChange: () => {},
        onYankSelectedVersion: noop,
        onDeprecateSelectedVersion: noop,
        onArchiveArtifact: noop,
        onReactivateArtifact: noop,
        onDeleteArtifact: noop,
      }),
    );
    expect(html).toContain("Despublicar versión (yank)");
    expect(html).toContain("Deprecar versión");
  });

  it("no muestra yank/deprecate versión cuando la versión es draft", () => {
    const html = renderToStaticMarkup(
      createElement(MetadataPanel, {
        detail: detailWithVersion("draft"),
        selectedVersion: "1.0.0",
        onVersionChange: () => {},
        onYankSelectedVersion: vi.fn(),
        onDeprecateSelectedVersion: vi.fn(),
        onArchiveArtifact: noop,
        onReactivateArtifact: noop,
        onDeleteArtifact: noop,
      }),
    );
    expect(html).not.toContain("Despublicar versión (yank)");
    expect(html).not.toContain("Deprecar versión");
  });

  it("muestra Reactivar cuando el paquete está archived", () => {
    const d = detailWithVersion("published");
    const archived: ArtifactDetailForPanel = { ...d, status: "archived" };
    const html = renderToStaticMarkup(
      createElement(MetadataPanel, {
        detail: archived,
        selectedVersion: "1.0.0",
        onVersionChange: () => {},
        onYankSelectedVersion: noop,
        onDeprecateSelectedVersion: noop,
        onArchiveArtifact: noop,
        onReactivateArtifact: noop,
        onDeleteArtifact: noop,
      }),
    );
    expect(html).toContain("Reactivar paquete");
    expect(html).not.toContain("Archivar paquete");
  });
});
