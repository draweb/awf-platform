import type { NextRequest } from "next/server";
import { getActor } from "@/lib/auth/get-actor";
import { canReadArtifactCatalog } from "@/lib/domain/permissions";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";
import { safeParseAwfAssetManifest } from "@awf/manifest-schema";

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadArtifactCatalog(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const body = await request.json();
    const raw = body.manifest ?? body;
    const parsed = safeParseAwfAssetManifest(raw);
    if (!parsed.success) {
      return jsonOk({ valid: false, errors: parsed.error.flatten() });
    }
    return jsonOk({ valid: true, manifest: parsed.data });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
