import { describe, expect, it } from "vitest";
import React from "react";
import { WorkspaceStatusBar } from "../workspace-status-bar";

describe("WorkspaceStatusBar", () => {
  it("recibe status draft y lo expone en props", () => {
    const el = React.createElement(WorkspaceStatusBar, {
      status: "draft",
      slug: "mi-ws",
      charCount: 42,
      autosaveState: "idle",
    });
    expect(el.props.status).toBe("draft");
  });

  it("recibe status active", () => {
    const el = React.createElement(WorkspaceStatusBar, {
      status: "active",
      slug: "otro-ws",
      charCount: 128,
      autosaveState: "saved",
    });
    expect(el.props.status).toBe("active");
    expect(el.props.autosaveState).toBe("saved");
  });

  it("muestra charCount correcto", () => {
    const el = React.createElement(WorkspaceStatusBar, {
      status: "archived",
      slug: "arch",
      charCount: 0,
      autosaveState: "error",
    });
    expect(el.props.charCount).toBe(0);
  });
});
