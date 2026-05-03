import type { NextRequest } from "next/server";
import { createPendingDeviceAuthorization } from "@/lib/auth/cli-device";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { publicBaseUrlFromRequest } from "@/lib/http/public-base-url";
import {
  deviceCodeCreateRateLimitKey,
  isDeviceCodeCreateRateLimited,
} from "@/lib/rate-limit/device-code";

const DEVICE_TTL_MS = 15 * 60 * 1000;
const INTERVAL_SEC = 5;

export async function POST(request: NextRequest) {
  try {
    const rlKey = deviceCodeCreateRateLimitKey(request);
    if (isDeviceCodeCreateRateLimited(rlKey)) {
      throw new ApiError({
        code: "RATE_LIMITED",
        httpStatus: 429,
        message: "Demasiadas solicitudes de login CLI; probá en un minuto.",
      });
    }

    const { userCode, deviceCode, expiresAt } = await createPendingDeviceAuthorization(DEVICE_TTL_MS);
    const base = publicBaseUrlFromRequest(request);
    const verification_uri = `${base}/cli/device?user_code=${encodeURIComponent(userCode)}`;
    const expires_in = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    return jsonOk({
      user_code: userCode,
      device_code: deviceCode,
      verification_uri,
      expires_in,
      interval: INTERVAL_SEC,
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
