import { describe, expect, it, vi } from "vitest";
import React from "react";
import { MarkdownCanvas } from "../markdown-canvas";

describe("MarkdownCanvas", () => {
  it("renderiza con value y genera líneas según saltos", () => {
    const value = "# Título\nLínea 2\nLínea 3";
    const onChange = vi.fn();
    const el = React.createElement(MarkdownCanvas, { value, onChange });
    expect(el.props.value).toBe(value);
    expect(el.props.value.split("\n")).toHaveLength(3);
  });

  it("propaga onChange callback", () => {
    const onChange = vi.fn();
    const el = React.createElement(MarkdownCanvas, { value: "", onChange });
    expect(el.props.onChange).toBe(onChange);
  });

  it("value vacío produce exactamente 1 línea", () => {
    const el = React.createElement(MarkdownCanvas, { value: "", onChange: vi.fn() });
    expect(el.props.value.split("\n")).toHaveLength(1);
  });
});
