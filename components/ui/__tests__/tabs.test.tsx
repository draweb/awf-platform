import { describe, expect, it } from "vitest";
import React from "react";
import { Tabs } from "../tabs";

describe("Tabs", () => {
  it("renderiza pestañas con ids y contenido", () => {
    const el = React.createElement(Tabs, {
      defaultTabId: "b",
      tabs: [
        { id: "a", label: "Uno", content: React.createElement("span", null, "A") },
        { id: "b", label: "Dos", content: React.createElement("span", null, "B") },
      ],
    });
    expect(el.props.defaultTabId).toBe("b");
    expect(el.props.tabs).toHaveLength(2);
    expect(el.props.tabs[1].label).toBe("Dos");
  });
});
