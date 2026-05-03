/** Fragmentos reutilizables del documento OpenAPI 3.0 (AWF API v1). */

import { openApiParameters } from "./components-parameters.js";
import { openApiResponseSchemas } from "./schemas-responses.js";

export const openApiComponents = {
  securitySchemes: {
    BearerAuth: {
      type: "http" as const,
      scheme: "bearer",
      description:
        "Token en `Authorization: Bearer`. Para la API de producto: PAT con prefijo `awf_pat_`. Para `GET /api/v1/cron/housekeeping`: valor de la variable de entorno `CRON_SECRET` (mismo header Bearer).",
    },
    CookieSession: {
      type: "apiKey" as const,
      in: "cookie" as const,
      name: "awf_session",
      description: "Sesión del panel (JWT en cookie httpOnly). Mutuamente excluyente con PAT según el handler.",
    },
  },
  schemas: {
    ApiError: {
      type: "object",
      required: ["error"],
      properties: {
        error: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: {
              type: "string",
              description: "Código estable de error (p. ej. UNAUTHORIZED, VALIDATION_ERROR).",
              enum: [
                "UNAUTHORIZED",
                "FORBIDDEN",
                "NOT_FOUND",
                "CONFLICT",
                "VALIDATION_ERROR",
                "MANIFEST_INVALID",
                "VERSION_EXISTS",
                "RATE_LIMITED",
                "INTERNAL",
                "NOT_IMPLEMENTED",
                "SERVICE_UNAVAILABLE",
                "DEVICE_CODE_INVALID",
              ],
            },
            message: { type: "string" },
            details: { description: "Detalle opcional (p. ej. flatten de Zod)." },
          },
        },
      },
    },
    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 1, description: "Contraseña del usuario del panel." },
      },
      example: { email: "admin@example.com", password: "••••••••" },
    },
    LoginOk: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string", nullable: true },
            role: { type: "string" },
          },
        },
      },
    },
    ChangePasswordRequest: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: { type: "string" },
        newPassword: { type: "string" },
      },
    },
    OkTrue: {
      type: "object",
      properties: { ok: { type: "boolean", enum: [true] } },
    },
    InstallEventBody: {
      type: "object",
      required: ["artifactName", "version", "cliVersion"],
      properties: {
        artifactName: { type: "string", minLength: 1 },
        version: { type: "string", minLength: 1 },
        projectName: { type: "string" },
        workspacePathHash: { type: "string" },
        cliVersion: { type: "string", minLength: 1 },
      },
    },
    ArtifactCreateBody: {
      type: "object",
      required: ["name", "type", "description"],
      properties: {
        name: { type: "string", minLength: 1 },
        type: { type: "string", minLength: 1 },
        description: { type: "string", minLength: 1 },
        visibility: { type: "string", enum: ["private", "internal", "public"] },
      },
    },
    ArtifactPatchBody: {
      type: "object",
      description: "Todos los campos opcionales; al menos uno suele enviarse.",
      properties: {
        description: { type: "string", minLength: 1 },
        type: { type: "string", description: "Tipo en nomenclatura API (p. ej. `rule`); se valida contra el catálogo interno." },
        visibility: { type: "string", enum: ["private", "internal", "public"] },
        status: { type: "string", enum: ["active", "deprecated", "archived"] },
      },
    },
    TagPutBody: {
      type: "object",
      required: ["version"],
      properties: { version: { type: "string", minLength: 1 } },
    },
    PatCreateBody: {
      type: "object",
      required: ["name", "scopes"],
      properties: {
        name: { type: "string", minLength: 1, maxLength: 128 },
        scopes: { type: "array", items: { type: "string" }, minItems: 1 },
        expiresAt: { oneOf: [{ type: "string", minLength: 1 }, { type: "null" }] },
      },
    },
    PatRenameBody: {
      type: "object",
      required: ["name"],
      properties: { name: { type: "string", minLength: 1, maxLength: 128 } },
    },
    WorkspaceCreateBody: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
        description: { type: "string" },
        stacks: { type: "array", items: { type: "string" } },
        status: { type: "string", enum: ["draft", "active", "archived"] },
        semver: { type: "string" },
        rawMarkdown: { type: "string" },
        customMarkdown: { type: "boolean" },
        constitution: { type: "object", additionalProperties: true },
      },
    },
    WorkspaceArtifactsPutBody: {
      type: "object",
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            required: ["artifactId"],
            properties: {
              artifactId: { type: "string" },
              pinnedVersion: { type: "string", nullable: true },
              order: { type: "integer" },
            },
          },
        },
      },
    },
    ValidateManifestBody: {
      type: "object",
      properties: {
        manifest: {
          type: "object",
          properties: {
            name: { type: "string" },
            version: { type: "string" },
            type: { type: "string" },
          },
        },
      },
      description: "También se acepta el manifest en la raíz del JSON.",
    },
    ...openApiResponseSchemas,
  },
  parameters: openApiParameters,
} as const;
