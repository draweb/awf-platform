import { z } from "zod";
import type { NextRequest } from "next/server";
import { approveDeviceAuthorizationByUserCode } from "@/lib/auth/cli-device";
import { getActor } from "@/lib/auth/get-actor";
import { writeAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

const bodySchema = z.object({
  user_code: z.string().min(1).max(32),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor || actor.authMethod !== "session") {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Iniciá sesión en el panel para autorizar el CLI." });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Body inválido",
        details: parsed.error.flatten(),
      });
    }

    const result = await approveDeviceAuthorizationByUserCode(parsed.data.user_code, actor.userId);
    if (!result.ok) {
      const msg =
        result.reason === "expired"
          ? "Este código expiró. Ejecutá awf login de nuevo en la terminal."
          : "Código inválido o ya usado.";
      throw new ApiError({ code: "DEVICE_CODE_INVALID", httpStatus: 400, message: msg });
    }

    await writeAudit({
      actorId: actor.userId,
      action: "cli.device_authorized",
      entityType: "cli_device_authorization",
      entityId: result.id,
      after: { userCodeProvided: true },
    });

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
