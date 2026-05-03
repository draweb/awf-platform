import { describe, expect, it } from "vitest";
import {
  pickVersionAfterRefetch,
  readApiErrorMessage,
  stripTarballCacheKeysForArtifact,
} from "../artifact-explorer-mutation-helpers";

describe("readApiErrorMessage", () => {
  it("extrae message del error AWF", () => {
    expect(readApiErrorMessage({ error: { message: "Sin permiso" } })).toBe("Sin permiso");
  });

  it("devuelve fallback sin body válido", () => {
    expect(readApiErrorMessage(null)).toBe("Error desconocido");
  });
});

describe("pickVersionAfterRefetch", () => {
  it("si la versión previa fue yanked, elige primera published", () => {
    const versions = [
      { version: "2.0.0", status: "yanked" },
      { version: "1.0.0", status: "published" },
    ];
    expect(pickVersionAfterRefetch(versions, "2.0.0")).toBe("1.0.0");
  });

  it("mantiene la versión si sigue existiendo y no es yanked", () => {
    const versions = [
      { version: "2.0.0", status: "published" },
      { version: "1.0.0", status: "deprecated" },
    ];
    expect(pickVersionAfterRefetch(versions, "1.0.0")).toBe("1.0.0");
  });
});

describe("stripTarballCacheKeysForArtifact", () => {
  it("elimina solo claves del artefacto", () => {
    const cache = {
      "@a/pkg@1.0.0": [],
      "@a/pkg@2.0.0": [],
      "@other@1.0.0": [],
    };
    const next = stripTarballCacheKeysForArtifact("@a/pkg", cache);
    expect(Object.keys(next)).toEqual(["@other@1.0.0"]);
  });
});
