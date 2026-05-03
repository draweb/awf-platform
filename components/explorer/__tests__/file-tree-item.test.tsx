import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FileTreeItem } from "../file-tree-item";

describe("FileTreeItem", () => {
  it("carpeta expandible muestra chevron y folder", () => {
    const html = renderToStaticMarkup(
      createElement(FileTreeItem, {
        depth: 0,
        icon: "folder",
        label: "@awf/pkg",
        expanded: false,
        expandable: true,
        onToggle: () => {},
      }),
    );
    expect(html).toContain("chevron_right");
    expect(html).toContain("@awf/pkg");
  });

  it("archivo activo incluye borde primary", () => {
    const html = renderToStaticMarkup(
      createElement(FileTreeItem, {
        depth: 1,
        icon: "description",
        label: "manifest.json",
        active: true,
        onClick: () => {},
      }),
    );
    expect(html).toContain("border-primary-container");
    expect(html).toContain("manifest.json");
  });
});
