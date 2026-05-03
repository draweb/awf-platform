import { describe, expect, it } from "vitest";
import {
  WORKSPACE_VERSION_SELECT_LATEST,
  workspaceArtifactPinSelectModel,
} from "../workspace-artifact-version-pin";

describe("workspaceArtifactPinSelectModel", () => {
  it("sin pin usa sentinela latest", () => {
    expect(workspaceArtifactPinSelectModel("", ["1.0.0"])).toEqual({
      selectValue: WORKSPACE_VERSION_SELECT_LATEST,
      legacyOption: false,
      legacyPin: "",
    });
  });

  it("pin que coincide con catálogo no es legacy", () => {
    expect(workspaceArtifactPinSelectModel("1.0.0", ["1.0.0", "0.9.0"])).toEqual({
      selectValue: "1.0.0",
      legacyOption: false,
      legacyPin: "1.0.0",
    });
  });

  it("pin fuera del catálogo activa opción legacy", () => {
    expect(workspaceArtifactPinSelectModel("^1.0.0", ["1.0.0"])).toEqual({
      selectValue: "^1.0.0",
      legacyOption: true,
      legacyPin: "^1.0.0",
    });
  });
});
