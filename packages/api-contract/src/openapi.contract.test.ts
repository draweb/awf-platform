import { describe, expect, it } from "vitest";
import OpenAPISchemaValidator from "openapi-schema-validator";
import { openApiDocument } from "./openapi/document.js";

/** Contrato: cada entrada debe existir en `paths` con el método indicado. */
const EXPECTED_OPERATIONS: Array<{ method: string; path: string }> = [
  { method: "GET", path: "/api/v1/health" },
  { method: "GET", path: "/api/v1/cron/housekeeping" },
  { method: "POST", path: "/api/v1/validate/manifest" },
  { method: "POST", path: "/api/v1/validate/package" },
  { method: "POST", path: "/api/v1/auth/login" },
  { method: "POST", path: "/api/v1/auth/logout" },
  { method: "GET", path: "/api/v1/auth/me" },
  { method: "POST", path: "/api/v1/auth/change-password" },
  { method: "POST", path: "/api/v1/auth/refresh" },
  { method: "POST", path: "/api/v1/auth/device/code" },
  { method: "POST", path: "/api/v1/auth/device/authorize" },
  { method: "POST", path: "/api/v1/auth/device/token" },
  { method: "GET", path: "/api/v1/artifacts" },
  { method: "POST", path: "/api/v1/artifacts" },
  { method: "GET", path: "/api/v1/artifacts/{encodedName}" },
  { method: "PATCH", path: "/api/v1/artifacts/{encodedName}" },
  { method: "DELETE", path: "/api/v1/artifacts/{encodedName}" },
  { method: "GET", path: "/api/v1/artifacts/{encodedName}/resolve" },
  { method: "GET", path: "/api/v1/artifacts/{encodedName}/versions" },
  { method: "POST", path: "/api/v1/artifacts/{encodedName}/versions" },
  { method: "GET", path: "/api/v1/artifacts/{encodedName}/versions/{version}" },
  { method: "POST", path: "/api/v1/artifacts/{encodedName}/versions/{version}/publish" },
  { method: "POST", path: "/api/v1/artifacts/{encodedName}/versions/{version}/deprecate" },
  { method: "POST", path: "/api/v1/artifacts/{encodedName}/versions/{version}/yank" },
  { method: "GET", path: "/api/v1/artifacts/{encodedName}/tags" },
  { method: "PUT", path: "/api/v1/artifacts/{encodedName}/tags/{tag}" },
  { method: "DELETE", path: "/api/v1/artifacts/{encodedName}/tags/{tag}" },
  { method: "GET", path: "/api/v1/artifacts/{encodedName}/tarball/{version}" },
  { method: "GET", path: "/api/v1/libraries" },
  { method: "POST", path: "/api/v1/libraries" },
  { method: "GET", path: "/api/v1/libraries/{id}" },
  { method: "PATCH", path: "/api/v1/libraries/{id}" },
  { method: "DELETE", path: "/api/v1/libraries/{id}" },
  { method: "GET", path: "/api/v1/libraries/{id}/artifacts" },
  { method: "PUT", path: "/api/v1/libraries/{id}/artifacts" },
  { method: "GET", path: "/api/v1/search" },
  { method: "POST", path: "/api/v1/install-events" },
  { method: "GET", path: "/api/v1/workspaces" },
  { method: "POST", path: "/api/v1/workspaces" },
  { method: "GET", path: "/api/v1/workspaces/{id}" },
  { method: "PATCH", path: "/api/v1/workspaces/{id}" },
  { method: "DELETE", path: "/api/v1/workspaces/{id}" },
  { method: "PUT", path: "/api/v1/workspaces/{id}/artifacts" },
  { method: "GET", path: "/api/v1/workspaces/{id}/awf-workspace.json" },
  { method: "GET", path: "/api/v1/workspaces/{id}/libraries" },
  { method: "PUT", path: "/api/v1/workspaces/{id}/libraries" },
  { method: "GET", path: "/api/v1/user/personal-access-tokens" },
  { method: "POST", path: "/api/v1/user/personal-access-tokens" },
  { method: "PATCH", path: "/api/v1/user/personal-access-tokens/{id}" },
  { method: "DELETE", path: "/api/v1/user/personal-access-tokens/{id}" },
  { method: "GET", path: "/api/v1/admin/stats" },
  { method: "GET", path: "/api/v1/admin/dashboard" },
  { method: "GET", path: "/api/v1/admin/audit-logs" },
  { method: "GET", path: "/api/v1/admin/install-events" },
  { method: "GET", path: "/api/v1/admin/users" },
];

describe("OpenAPI document", () => {
  it("valida contra metaschema OpenAPI 3", () => {
    const validator = new OpenAPISchemaValidator({ version: 3 });
    const result = validator.validate(openApiDocument as Record<string, unknown>);
    expect(result.errors).toEqual([]);
  });

  it("incluye todas las operaciones de Route Handlers v1", () => {
    const paths = openApiDocument.paths as Record<string, Record<string, unknown>>;
    for (const { method, path } of EXPECTED_OPERATIONS) {
      const item = paths[path];
      expect(item, `missing path ${path}`).toBeTruthy();
      const op = method.toLowerCase();
      expect(item[op], `missing ${method} ${path}`).toBeTruthy();
    }
  });
});
