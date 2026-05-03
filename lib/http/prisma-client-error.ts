import { Prisma } from "@prisma/client";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import { ApiError } from "./errors";

/**
 * Traduce fallos habituales del cliente Prisma a mensajes accionables para el panel / logs.
 */
export function prismaClientErrorToApiError(e: unknown, context: string): ApiError | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2021") {
      return new ApiError({
        code: "INTERNAL",
        httpStatus: 503,
        message:
          "Faltan tablas en la base de datos (p. ej. `workspaces`). Aplicá migraciones en este entorno: `pnpm exec prisma migrate deploy` (producción) o `pnpm exec prisma migrate dev` (local), y reiniciá la app.",
        details: { prismaCode: e.code, context },
      });
    }
    if (e.code === "P2022") {
      return new ApiError({
        code: "INTERNAL",
        httpStatus: 503,
        message:
          "El esquema de la base de datos no coincide con el código (columna o tipo inexistente). Ejecutá `pnpm exec prisma migrate deploy` y volvé a intentar.",
        details: { prismaCode: e.code, context },
      });
    }
  }

  if (e instanceof PrismaClientInitializationError) {
    return new ApiError({
      code: "INTERNAL",
      httpStatus: 503,
      message:
        "No se pudo conectar a la base de datos. Comprobá que Postgres esté activo y que `DATABASE_URL` en `.env.local` sea correcta.",
      details: { prismaMessage: e.message, context },
    });
  }

  return null;
}
