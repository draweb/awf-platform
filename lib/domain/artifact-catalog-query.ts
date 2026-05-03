import type { ArtifactStatus, ArtifactVisibility, ArtifactType, Prisma } from "@prisma/client";
import { artifactTypeFromApi } from "@/lib/domain/artifact-types";

const MIN_Q_LEN = 2;

export type ParsedArtifactCatalogQuery = {
  /** Texto para `contains` en nombre/descripción; `null` si no aplica filtro de texto. */
  q: string | null;
  type: ArtifactType | null;
  status: ArtifactStatus | null;
  visibility: ArtifactVisibility | null;
};

function parseStatus(raw: string | null): ArtifactStatus | null | "invalid" {
  if (raw == null || raw.trim() === "") return null;
  const s = raw.trim();
  if (s === "active" || s === "deprecated" || s === "archived") return s;
  return "invalid";
}

function parseVisibility(raw: string | null): ArtifactVisibility | null | "invalid" {
  if (raw == null || raw.trim() === "") return null;
  const v = raw.trim();
  if (v === "private" || v === "internal" || v === "public") return v;
  return "invalid";
}

/**
 * Lee query params de `GET /api/v1/artifacts` (listado / panel Packages).
 * `q` con menos de {@link MIN_Q_LEN} caracteres no aplica filtro de texto (permite solo type/status/visibility).
 */
export function parseArtifactCatalogQueryParams(searchParams: URLSearchParams):
  | { ok: true; value: ParsedArtifactCatalogQuery }
  | { ok: false; message: string } {
  const qRaw = (searchParams.get("q") ?? "").trim();
  const q = qRaw.length >= MIN_Q_LEN ? qRaw : null;

  const typeParam = (searchParams.get("type") ?? "").trim();
  let type: ArtifactType | null = null;
  if (typeParam) {
    const t = artifactTypeFromApi(typeParam);
    if (!t) return { ok: false, message: `Tipo de artefacto desconocido: ${typeParam}` };
    type = t;
  }

  const st = parseStatus(searchParams.get("status"));
  if (st === "invalid") return { ok: false, message: "status inválido (active | deprecated | archived)" };

  const vis = parseVisibility(searchParams.get("visibility"));
  if (vis === "invalid") return { ok: false, message: "visibility inválida (private | internal | public)" };

  return { ok: true, value: { q, type, status: st, visibility: vis } };
}

export function buildArtifactCatalogWhere(parsed: ParsedArtifactCatalogQuery): Prisma.ArtifactWhereInput {
  const parts: Prisma.ArtifactWhereInput[] = [];
  if (parsed.q) {
    parts.push({
      OR: [
        { name: { contains: parsed.q, mode: "insensitive" } },
        { description: { contains: parsed.q, mode: "insensitive" } },
      ],
    });
  }
  if (parsed.type) parts.push({ type: parsed.type });
  if (parsed.status) parts.push({ status: parsed.status });
  if (parsed.visibility) parts.push({ visibility: parsed.visibility });
  return parts.length === 0 ? {} : { AND: parts };
}

export const artifactCatalogMinQueryLength = MIN_Q_LEN;
