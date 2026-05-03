import { z } from "zod";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { hasScope } from "@/lib/auth/scopes";
import { writeAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonOk, jsonUnexpected } from "@/lib/http/json";

const bodySchema = z.object({
  artifactName: z.string().min(1),
  version: z.string().min(1),
  projectName: z.string().optional(),
  workspacePathHash: z.string().optional(),
  cliVersion: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (actor.authMethod === "pat" && !hasScope(actor.scopes, "artifact:read")) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Scope artifact:read requerido" });
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
    const { artifactName, version, projectName, workspacePathHash, cliVersion } = parsed.data;
    const artifact = await prisma.artifact.findUnique({ where: { name: artifactName } });
    if (!artifact) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Artefacto no encontrado" });
    }
    const row = await prisma.installEvent.create({
      data: {
        artifactId: artifact.id,
        version,
        projectName,
        workspacePathHash,
        userId: actor.userId,
        cliVersion,
      },
    });
    await writeAudit({
      actorId: actor.userId,
      action: "install_event.create",
      entityType: "install_event",
      entityId: row.id,
      after: { artifactName, version, cliVersion },
    });
    return jsonOk({ event: row });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
