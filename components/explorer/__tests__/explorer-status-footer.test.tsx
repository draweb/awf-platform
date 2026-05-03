import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExplorerStatusFooter } from "../explorer-status-footer";

describe("ExplorerStatusFooter", () => {
  it("muestra error de catálogo cuando catalogError está definido", () => {
    const html = renderToStaticMarkup(
      createElement(ExplorerStatusFooter, {
        catalogLoading: false,
        catalogError: "Fallo de red",
        artifactCount: 0,
        hasMore: false,
        focusedPackageName: "@a/pkg",
        selectedVersion: "1.0.0",
        activeFileTitle: "manifest",
      }),
    );
    expect(html).toContain("Fallo de red");
  });

  it("muestra plural de artefactos y nombre de archivo", () => {
    const html = renderToStaticMarkup(
      createElement(ExplorerStatusFooter, {
        catalogLoading: false,
        catalogError: null,
        artifactCount: 3,
        hasMore: false,
        focusedPackageName: "@scope/n",
        selectedVersion: "2.0.0",
        activeFileTitle: "readme.md",
      }),
    );
    expect(html).toContain("Catálogo: 3 artefactos");
    expect(html).toContain("@scope/n @ 2.0.0");
    expect(html).toContain("readme.md");
  });
});
