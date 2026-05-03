import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/auth/get-actor";
import { canReadWorkspace, canViewWorkspace } from "@/lib/domain/permissions";
import { resolveMergedWorkspaceArtifacts } from "@/lib/domain/library-merge";
import { ApiError } from "@/lib/http/errors";
import { jsonError, jsonUnexpected } from "@/lib/http/json";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await getActor(request);
    if (!actor) {
      throw new ApiError({ code: "UNAUTHORIZED", httpStatus: 401, message: "Autenticación requerida" });
    }
    if (!canReadWorkspace(actor)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin permiso" });
    }
    const { id } = await ctx.params;
    const row = await prisma.workspace.findUnique({
      where: { id },
      include: {
        artifacts: {
          include: { artifact: { select: { name: true } } },
          orderBy: { order: "asc" },
        },
        libraries: {
          include: {
            library: {
              include: {
                artifacts: {
                  include: { artifact: { select: { name: true } } },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!row) {
      throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Workspace no encontrado" });
    }
    if (!canViewWorkspace(actor, row)) {
      throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: "Sin acceso" });
    }

    const merged = resolveMergedWorkspaceArtifacts(
      row.artifacts.map((w) => ({
        artifactId: w.artifactId,
        pinnedVersion: w.pinnedVersion,
        order: w.order,
        artifactName: w.artifact.name,
      })),
      row.libraries.map((wl) => ({
        libraryOrder: wl.order,
        artifacts: wl.library.artifacts.map((la) => ({
          artifactId: la.artifactId,
          pinnedVersion: la.pinnedVersion,
          order: la.order,
          artifactName: la.artifact.name,
        })),
      })),
    );

    const payload = {
      name: row.name,
      version: row.semver,
      stacks: row.stacks,
      instructionsMarkdown: row.rawMarkdown,
      artifacts: merged.map((m) => ({
        name: m.artifactName,
        range: m.pinnedVersion && m.pinnedVersion.length > 0 ? m.pinnedVersion : "*",
      })),
    };

    const body = JSON.stringify(payload, null, 2);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="awf.workspace.json"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e);
    console.error(e);
    return jsonUnexpected();
  }
}
