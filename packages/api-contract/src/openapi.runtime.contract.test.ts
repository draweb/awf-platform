import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { openApiDocument } from "./openapi/document.js";
import { workspacePatchBodyJsonSchema } from "./zod/workspace-patch.js";

/** Registra `components.schemas` en Ajv para resolver `$ref` locales `#/components/schemas/…`. */
function compilerForComponentsSchemas() {
  const raw = openApiDocument.components as { schemas: Record<string, Record<string, unknown>> };
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  for (const [name, schema] of Object.entries(raw.schemas)) {
    ajv.addSchema({ ...schema, $id: `#/components/schemas/${name}` } as object);
  }
  return ajv;
}

describe("Contrato runtime (Ajv vs schemas del documento)", () => {
  it("WorkspacePatchBody (Zod → JSON Schema): parche mínimo válido; name vacío inválido", () => {
    const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
    const validate = ajv.compile(workspacePatchBodyJsonSchema as object);
    expect(validate({ description: "ok" })).toBe(true);
    expect(validate({ name: "Nombre OK" })).toBe(true);
    expect(validate({ name: "" })).toBe(false);
  });

  it("ArtifactDetailResponse: fixture alineado al handler GET artifact", () => {
    const ajv = compilerForComponentsSchemas();
    const validate = ajv.getSchema("#/components/schemas/ArtifactDetailResponse");
    if (!validate) throw new Error("missing ArtifactDetailResponse schema");
    const payload = {
      id: "ckv_testartifact",
      name: "@acme/rules",
      type: "rule",
      description: "Reglas",
      owner: "user_1",
      visibility: "internal",
      status: "active",
      createdAt: "2025-01-15T12:00:00.000Z",
      updatedAt: "2025-01-15T12:00:00.000Z",
      versions: [
        {
          id: "ver_1",
          artifactId: "ckv_testartifact",
          version: "1.0.0",
          status: "published",
          manifest: { name: "@acme/rules", version: "1.0.0", type: "rule" },
          changelog: "first",
          tarballUrl: "blob:dummy",
          checksumSha256: "0".repeat(64),
          sizeBytes: 1024,
          createdBy: "user_1",
          publishedBy: "user_1",
          createdAt: "2025-01-15T12:00:00.000Z",
          publishedAt: "2025-01-15T12:00:00.000Z",
        },
      ],
      distTags: [
        {
          id: "dt_1",
          artifactId: "ckv_testartifact",
          tag: "latest",
          version: "1.0.0",
          updatedBy: "user_1",
          updatedAt: "2025-01-15T12:00:00.000Z",
        },
      ],
    };
    expect(validate(payload)).toBe(true);
  });

  it("AdminDashboardResponse: fixture mínimo válido", () => {
    const ajv = compilerForComponentsSchemas();
    const validate = ajv.getSchema("#/components/schemas/AdminDashboardResponse");
    if (!validate) throw new Error("missing AdminDashboardResponse schema");
    const payload = {
      artifacts: 1,
      versions: 2,
      libraries: 0,
      versionsPublished: 1,
      versionsDraftReview: 1,
      versionsDeprecatedYanked: 0,
      installEvents24h: 0,
      installEvents7d: 1,
      distinctInstallUsers7d: 1,
      installTrend7d: [0, 0, 0, 0, 0, 0, 1],
      recentWorkspaces: [
        {
          id: "ws_1",
          slug: "demo",
          name: "Demo",
          status: "draft",
          updatedAt: "2026-01-15T12:00:00.000Z",
        },
      ],
      topArtifactsByInstalls7d: [{ artifactName: "@acme/rules", count: 1 }],
      activityFeed: [
        {
          id: "a:1",
          kind: "audit",
          at: "2026-01-15T12:00:00.000Z",
          tag: "PUBLISH",
          message: "version.publish · version ver_1",
        },
      ],
    };
    expect(validate(payload)).toBe(true);
  });

  it("ApiError: exige error.code y error.message", () => {
    const schemas = (openApiDocument.components as { schemas: Record<string, unknown> }).schemas;
    const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
    const validate = ajv.compile(schemas.ApiError as object);
    expect(validate({ error: { code: "UNAUTHORIZED", message: "No token" } })).toBe(true);
    expect(validate({ error: { code: "UNAUTHORIZED" } })).toBe(false);
  });
});
