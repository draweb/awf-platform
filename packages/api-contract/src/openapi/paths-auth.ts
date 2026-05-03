import { E } from "./response-errors.js";

const S = (schema: string) => ({ $ref: `#/components/schemas/${schema}` });

export const pathsAuth = {
  "/api/v1/auth/login": {
    post: {
      operationId: "authLoginPanel",
      tags: ["Auth"],
      summary: "Login panel (cookie de sesión)",
      description:
        "Establece cookie `awf_session` httpOnly. Rate limit por IP. En desarrollo puede devolver 503 con código SERVICE_UNAVAILABLE si falta DATABASE_URL.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Sesión creada",
          headers: {
            "Set-Cookie": {
              schema: { type: "string" },
              description: "Cookie `awf_session`",
            },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginOk" },
            },
          },
        },
        "400": E.validation("Body inválido"),
        "401": E.invalidCredentials(),
        "429": E.rateLimited("Demasiados intentos de login"),
        "503": E.serviceUnavailable("Base no disponible o DATABASE_URL ausente (típico en desarrollo).", "Servicio no disponible"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/auth/logout": {
    post: {
      operationId: "authLogout",
      tags: ["Auth"],
      summary: "Cerrar sesión",
      description: "Invalida sesión en servidor y borra cookie `awf_session`.",
      security: [{ CookieSession: [] }],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OkTrue" },
            },
          },
        },
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/auth/me": {
    get: {
      operationId: "authMe",
      tags: ["Auth"],
      summary: "Usuario actual",
      description: "Sesión de panel o PAT. Con PAT incluye `scopes` en la respuesta.",
      security: [{ BearerAuth: [] }, { CookieSession: [] }],
      responses: {
        "200": {
          description: "Perfil",
          content: { "application/json": { schema: S("AuthMeResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/auth/change-password": {
    post: {
      operationId: "authChangePassword",
      tags: ["Auth"],
      summary: "Cambiar contraseña",
      description: "Solo con sesión de panel (no PAT).",
      security: [{ CookieSession: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Contraseña actualizada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OkTrue" },
            },
          },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("No es sesión de panel"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/auth/refresh": {
    post: {
      operationId: "authRefreshSession",
      tags: ["Auth"],
      summary: "Refresh de sesión (no implementado)",
      security: [],
      responses: {
        "501": {
          description: "No implementado",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "object",
                    properties: {
                      code: { type: "string", example: "NOT_IMPLEMENTED" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
