import { describe, it, expect } from "vitest";
import React from "react";
import { ConfirmDialog } from "../confirm-dialog";

describe("ConfirmDialog", () => {
  it("pasa title y confirmLabel", () => {
    const el = React.createElement(ConfirmDialog, {
      open: true,
      onClose: () => {},
      title: "¿Borrar?",
      confirmLabel: "Borrar",
      onConfirm: () => {},
    });
    expect(el.props.title).toBe("¿Borrar?");
    expect(el.props.confirmLabel).toBe("Borrar");
  });

  it("usa tone danger opcional", () => {
    const el = React.createElement(ConfirmDialog, {
      open: false,
      onClose: () => {},
      title: "T",
      confirmLabel: "OK",
      tone: "danger",
      onConfirm: () => {},
    });
    expect(el.props.tone).toBe("danger");
  });

  it("acepta pending", () => {
    const el = React.createElement(ConfirmDialog, {
      open: true,
      onClose: () => {},
      title: "T",
      confirmLabel: "OK",
      pending: true,
      onConfirm: async () => {},
    });
    expect(el.props.pending).toBe(true);
  });
});
