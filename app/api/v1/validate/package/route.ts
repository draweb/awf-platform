import type { NextRequest } from "next/server";
import { getActor } from "@/lib/auth/get-actor";
import { canReadArtifactCatalog } from "@/lib/domain/permissions";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

/** Stub: validación profunda de tarball en follow-up (requeriments §21). */
export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadArtifactCatalog(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Se requiere multipart con campo tarball",
      });
    }
    const form = await request.formData();
    const file = form.get("tarball");
    if (!(file instanceof File) || file.size === 0) {
      return jsonOk({ valid: false, message: "Falta tarball" });
    }
    return jsonOk({ valid: true, sizeBytes: file.size, note: "Validación superficial; ampliar con manifest-schema" });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
