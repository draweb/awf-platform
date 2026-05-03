import type { NextRequest } from "next/server";
import { getActor } from "@/lib/auth/get-actor";
import { canAdminStats } from "@/lib/domain/permissions";
import { getAdminDashboardSnapshot } from "@/lib/admin/dashboard-snapshot";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

export async function GET(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canAdminStats(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso admin" });
    }
    const data = await getAdminDashboardSnapshot();
    return jsonOk(data);
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
