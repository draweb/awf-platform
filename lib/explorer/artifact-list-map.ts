import type { ArtifactListRow } from "@/components/explorer/file-tree";

/** Respuesta mínima de `GET /api/v1/artifacts/{encodedName}` para fusionar al catálogo (deep link). */
export function artifactListRowFromArtifactDetailJson(raw: Record<string, unknown>): ArtifactListRow | null {
  const id = raw.id != null ? String(raw.id) : "";
  const name = raw.name != null ? String(raw.name) : "";
  const type = raw.type != null ? String(raw.type) : "";
  const status = raw.status != null ? String(raw.status) : "active";
  if (!id || !name) return null;
  const versionsRaw = Array.isArray(raw.versions) ? raw.versions : [];
  const versions = versionsRaw
    .map((vr) => {
      const v = vr as Record<string, unknown>;
      const version = String(v.version ?? "");
      const st = String(v.status ?? "");
      return { version, status: st };
    })
    .filter((v) => v.version && v.status === "published")
    .map((v) => ({ version: v.version }));
  return { id, name, type, status, versions };
}
