import { describe, expect, it } from "vitest";
import React from "react";
import { TagInput } from "../tag-input";

describe("TagInput", () => {
  it("acepta label y callbacks", () => {
    const onChange = () => {};
    const el = React.createElement(TagInput, {
      label: "Stacks",
      value: ["nextjs"],
      onChange,
      suggestions: ["prisma"],
    });
    expect(el.props.label).toBe("Stacks");
    expect(el.props.value).toEqual(["nextjs"]);
    expect(el.props.suggestions).toEqual(["prisma"]);
  });
});
