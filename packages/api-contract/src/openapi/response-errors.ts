import { REF } from "./refs.js";

export function apiErrorResponse(args: {
  description: string;
  code: string;
  message: string;
  details?: unknown;
}) {
  const error: Record<string, unknown> = { code: args.code, message: args.message };
  if (args.details !== undefined) error.details = args.details;
  return {
    description: args.description,
    content: {
      "application/json": {
        schema: { $ref: REF.ApiError },
        example: { error },
      },
    },
  };
}

/** Respuestas JSON de error §34.2 con `example` para Swagger / generadores. */
export const E = {
  validation: (description: string) =>
    apiErrorResponse({ description, code: "VALIDATION_ERROR", message: "Validación fallida" }),
  unauthorized: (description: string) =>
    apiErrorResponse({ description, code: "UNAUTHORIZED", message: "Autenticación requerida" }),
  /** Login panel: mismas semánticas que `POST /auth/login` ante password incorrecto. */
  invalidCredentials: () =>
    apiErrorResponse({
      description: "Email o contraseña incorrectos.",
      code: "UNAUTHORIZED",
      message: "Credenciales inválidas",
    }),
  forbidden: (description: string) =>
    apiErrorResponse({ description, code: "FORBIDDEN", message: "Sin permiso para esta operación" }),
  notFound: (description: string) =>
    apiErrorResponse({ description, code: "NOT_FOUND", message: "Recurso no encontrado" }),
  conflict: (description: string) =>
    apiErrorResponse({ description, code: "CONFLICT", message: "Conflicto con el estado actual" }),
  manifestInvalid: (description: string) =>
    apiErrorResponse({ description, code: "MANIFEST_INVALID", message: "Manifest inválido" }),
  versionExists: (description: string) =>
    apiErrorResponse({ description, code: "VERSION_EXISTS", message: "La versión ya existe" }),
  rateLimited: (description: string) =>
    apiErrorResponse({ description, code: "RATE_LIMITED", message: "Demasiadas solicitudes" }),
  internal: (description: string) =>
    apiErrorResponse({ description, code: "INTERNAL", message: "Error interno" }),
  serviceUnavailable: (description: string, message: string) =>
    apiErrorResponse({ description, code: "SERVICE_UNAVAILABLE", message }),
  notImplemented: (description: string) =>
    apiErrorResponse({ description, code: "NOT_IMPLEMENTED", message: "No implementado" }),
  deviceCodeInvalid: (description: string) =>
    apiErrorResponse({
      description,
      code: "DEVICE_CODE_INVALID",
      message: "Código de dispositivo o usuario inválido o expirado",
    }),
};
