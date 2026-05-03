import { E } from "./response-errors.js";

export const pathsDeviceAuth = {
  "/api/v1/auth/device/code": {
    post: {
      operationId: "authDeviceCode",
      tags: ["Auth"],
      summary: "OAuth2 device flow — solicitar user_code y device_code",
      description: "Público (rate limited). Inicia el flujo de login CLI.",
      security: [],
      responses: {
        "200": {
          description: "Códigos emitidos",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["user_code", "device_code", "verification_uri", "expires_in", "interval"],
                properties: {
                  user_code: { type: "string" },
                  device_code: { type: "string" },
                  verification_uri: { type: "string", format: "uri" },
                  expires_in: { type: "integer" },
                  interval: { type: "integer", description: "Segundos mínimos entre polls en /auth/device/token" },
                },
              },
            },
          },
          links: {
            PollDeviceToken: {
              operationId: "authDeviceToken",
              description: "El CLI hace polling enviando `device_code` hasta recibir token o estado pending/slow_down.",
              requestBody: '{"device_code":"$response.body#/device_code"}',
            },
            AuthorizeInPanel: {
              operationId: "authDeviceAuthorize",
              description: "Tras abrir `verification_uri`, el usuario autenticado envía `user_code` en el cuerpo JSON.",
              requestBody: '{"user_code":"$response.body#/user_code"}',
            },
          },
        },
        "429": E.rateLimited("Demasiadas solicitudes de device code"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/auth/device/authorize": {
    post: {
      operationId: "authDeviceAuthorize",
      tags: ["Auth"],
      summary: "OAuth2 device flow — aprobar con user_code (sesión panel)",
      security: [{ CookieSession: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["user_code"],
              properties: { user_code: { type: "string", maxLength: 32 } },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Autorizado",
          content: {
            "application/json": {
              schema: { type: "object", properties: { ok: { type: "boolean", enum: [true] } } },
            },
          },
        },
        "400": E.deviceCodeInvalid("Código de usuario inválido, expirado o ya usado."),
        "401": E.unauthorized("Se requiere sesión de panel en cookie."),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/auth/device/token": {
    post: {
      operationId: "authDeviceToken",
      tags: ["Auth"],
      summary: "OAuth2 device flow — canjear device_code por access_token",
      description:
        "Polling desde el CLI. Puede devolver `authorization_pending`, `slow_down`, o tokens OAuth2 (`access_token`, `token_type`, `expires_in`).",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["device_code"],
              properties: { device_code: { type: "string", maxLength: 512 } },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Pendiente, slow_down o éxito",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      authorization_pending: { type: "boolean", enum: [true] },
                      error: { type: "string", enum: ["authorization_pending"] },
                    },
                  },
                  {
                    type: "object",
                    properties: {
                      slow_down: { type: "boolean", enum: [true] },
                      error: { type: "string", enum: ["slow_down"] },
                    },
                  },
                  {
                    type: "object",
                    properties: {
                      access_token: { type: "string" },
                      token_type: { type: "string", example: "Bearer" },
                      expires_in: { type: "integer" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": E.deviceCodeInvalid("Código de dispositivo inválido o expirado."),
        "500": E.internal("Error interno"),
      },
    },
  },
};
