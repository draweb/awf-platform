import type { NextRequest } from "next/server";
import { z } from "zod";
import { changePasswordForSessionUser } from "@/lib/auth/change-password";
import { getActor } from "@/lib/auth/get-actor";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "No autenticado" });
    }
    if (actor.authMethod !== "session" || !actor.sessionId) {
      throw new ApiError({
        code: "FORBIDDEN",
        httpStatus: 403,
        message:
          "Solo podés cambiar la contraseña cuando iniciás sesión en el panel con email y contraseña.",
      });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Body inválido",
        details: parsed.error.flatten(),
      });
    }

    await changePasswordForSessionUser({
      userId: actor.userId,
      keepSessionId: actor.sessionId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
