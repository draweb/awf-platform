import { describe, it, expect } from "vitest";
import React from "react";
import { InputField } from "../input-field";

describe("InputField component", () => {
  it("renders with required label", () => {
    const el = React.createElement(InputField, { label: "Email" });
    expect(el.props.label).toBe("Email");
  });

  it("accepts icon prop", () => {
    const el = React.createElement(InputField, {
      label: "Email",
      icon: "alternate_email",
    });
    expect(el.props.icon).toBe("alternate_email");
  });

  it("accepts trailing ReactNode", () => {
    const trailing = React.createElement("a", { href: "#" }, "Recover");
    const el = React.createElement(InputField, {
      label: "Password",
      trailing,
    });
    expect(el.props.trailing).toBeTruthy();
  });

  it("accepts passwordVisibilityToggle prop", () => {
    const el = React.createElement(InputField, {
      label: "Password",
      passwordVisibilityToggle: true,
    });
    expect(el.props.passwordVisibilityToggle).toBe(true);
  });

  it("passes HTML input attributes through", () => {
    const el = React.createElement(InputField, {
      label: "Email",
      type: "email",
      placeholder: "test@example.com",
      required: true,
    });
    expect(el.props.type).toBe("email");
    expect(el.props.placeholder).toBe("test@example.com");
    expect(el.props.required).toBe(true);
  });

  it("defaults className to empty string", () => {
    const el = React.createElement(InputField, { label: "Test" });
    expect(el.props.className).toBeUndefined();
  });
});
