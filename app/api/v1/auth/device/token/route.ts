import { z } from "zod";
import type { NextRequest } from "next/server";
import { exchangeDeviceAuthorization, hashDeviceCode } from "@/lib/auth/cli-device";
import { writeAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { pollTooSoon } from "@/lib/rate-limit/device-token-poll";

const bodySchema = z.object({
  device_code: z.string().min(1).max(512),
});

export async function POST(request: NextRequest) {
  try {
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

    const deviceCode = parsed.data.device_code;
    const dch = hashDeviceCode(deviceCode);
    if (pollTooSoon(dch)) {
      return jsonOk({ slow_down: true as const, error: "slow_down" });
    }

    const result = await exchangeDeviceAuthorization(deviceCode);
    if (result.type === "pending") {
      return jsonOk({ authorization_pending: true as const, error: "authorization_pending" });
    }
    if (result.type === "invalid") {
      throw new ApiError({
        code: "DEVICE_CODE_INVALID",
        httpStatus: 400,
        message: "Código de dispositivo inválido o expirado.",
      });
    }

    await writeAudit({
      actorId: result.userId,
      action: "cli.token_issued",
      entityType: "cli_access_token",
      entityId: result.tokenId,
      after: { expires_in: result.expires_in },
    });

    return jsonOk({
      access_token: result.access_token,
      token_type: "Bearer",
      expires_in: result.expires_in,
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
