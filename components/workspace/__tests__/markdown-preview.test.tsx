import { describe, expect, it } from "vitest";
import React from "react";
import { MarkdownPreview } from "../markdown-preview";

describe("MarkdownPreview", () => {
  it("acepta un valor markdown como prop", () => {
    const el = React.createElement(MarkdownPreview, { value: "# H1\n- item" });
    expect(el.props.value).toContain("# H1");
    expect(el.props.value).toContain("- item");
  });

  it("valor vacío no lanza", () => {
    const el = React.createElement(MarkdownPreview, { value: "" });
    expect(el.props.value).toBe("");
  });

  it("pasa code fences en el value correctamente", () => {
    const md = "```\nconsole.log('hello');\n```";
    const el = React.createElement(MarkdownPreview, { value: md });
    expect(el.props.value).toContain("```");
  });
});
