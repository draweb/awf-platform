import { E } from "./response-errors.js";

/** Rutas sin prefijo duplicado: claves son paths completos bajo /api/v1 */
const S = (name: string) => ({ $ref: `#/components/schemas/${name}` });

export const pathsHealthCronValidate = {
  "/api/v1/health": {
    get: {
      operationId: "healthCheck",
      tags: ["Health"],
      summary: "Health check",
      description: "Comprueba conectividad con Postgres. No requiere autenticación.",
      security: [],
      responses: {
        "200": {
          description: "Servicio y base OK",
          content: { "application/json": { schema: S("HealthOkResponse") } },
        },
        "503": {
          description: "Base no disponible",
          content: { "application/json": { schema: S("HealthDegradedResponse") } },
        },
      },
    },
  },
  "/api/v1/cron/housekeeping": {
    get: {
      operationId: "cronHousekeeping",
      tags: ["Cron"],
      summary: "Limpieza de sesiones expiradas",
      description:
        "Pensado para Vercel Cron. Requiere `Authorization: Bearer` con el valor exacto de `CRON_SECRET`. Si `CRON_SECRET` no está definido, responde 503.",
      security: [{ BearerAuth: [] }],
      responses: {
        "200": {
          description: "Sesiones eliminadas",
          content: { "application/json": { schema: S("HousekeepingOkResponse") } },
        },
        "401": E.unauthorized("Bearer distinto de CRON_SECRET."),
        "403": E.forbidden("Entorno sin CRON_SECRET configurado."),
        "503": E.serviceUnavailable("Secret de cron no configurado en el servidor.", "Servicio no disponible"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/validate/manifest": {
    post: {
      operationId: "validateManifestFragment",
      tags: ["Validate"],
      summary: "Validar fragmento de manifest",
      security: [{ BearerAuth: [] }, { CookieSession: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidateManifestBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Resultado de validación",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      valid: { type: "boolean", enum: [false] },
                      errors: { type: "object" },
                    },
                  },
                  {
                    type: "object",
                    properties: {
                      valid: { type: "boolean", enum: [true] },
                      manifest: { type: "object" },
                    },
                  },
                ],
              },
            },
          },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso artifact:read"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/validate/package": {
    post: {
      operationId: "validatePackageTarball",
      tags: ["Validate"],
      summary: "Validación superficial de tarball (multipart)",
      description: "Requiere `multipart/form-data` con campo `tarball` (archivo).",
      security: [{ BearerAuth: [] }, { CookieSession: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["tarball"],
              properties: {
                tarball: { type: "string", format: "binary", description: "Archivo .tgz" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Resultado",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  valid: { type: "boolean" },
                  sizeBytes: { type: "integer" },
                  message: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        "400": E.validation("Content-Type debe ser multipart/form-data con campo tarball."),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "500": E.internal("Error interno"),
      },
    },
  },
};
