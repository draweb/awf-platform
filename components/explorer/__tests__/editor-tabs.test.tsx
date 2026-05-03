import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EditorTabs } from "../editor-tabs";

describe("EditorTabs", () => {
  it("renderiza una tab por item con título y botón cerrar", () => {
    const html = renderToStaticMarkup(
      createElement(EditorTabs, {
        tabs: [
          { id: "a", title: "manifest.json" },
          { id: "b", title: "changelog.md" },
        ],
        activeId: "a",
        onSelect: () => {},
        onClose: () => {},
        tabPanelId: "explorer-editor-panel",
      }),
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain("manifest.json");
    expect(html).toContain("changelog.md");
    expect(html).toContain("Cerrar manifest.json");
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-controls="explorer-editor-panel"');
    expect(html).toContain("data_object");
    expect(html).toContain("article");
  });
});
