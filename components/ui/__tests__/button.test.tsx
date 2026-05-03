import { describe, it, expect } from "vitest";
import React from "react";
import { Button } from "../button";

describe("Button component", () => {
  it("renders with default primary variant", () => {
    const el = React.createElement(Button, null, "Click me");
    expect(el.props.children).toBe("Click me");
    expect(el.props.variant).toBeUndefined();
  });

  it("accepts variant prop", () => {
    const el = React.createElement(Button, { variant: "ghost" }, "Ghost");
    expect(el.props.variant).toBe("ghost");
  });

  it("acepta variant danger", () => {
    const el = React.createElement(Button, { variant: "danger" }, "Eliminar");
    expect(el.props.variant).toBe("danger");
  });

  it("passes disabled prop through", () => {
    const el = React.createElement(Button, { disabled: true }, "Disabled");
    expect(el.props.disabled).toBe(true);
  });

  it("accepts icon as ReactNode", () => {
    const icon = React.createElement("span", null, "→");
    const el = React.createElement(Button, { icon }, "With icon");
    expect(el.props.icon).toBeTruthy();
    expect(el.props.children).toBe("With icon");
  });

  it("accepts type=submit for forms", () => {
    const el = React.createElement(Button, { type: "submit" }, "Submit");
    expect(el.props.type).toBe("submit");
  });
});
