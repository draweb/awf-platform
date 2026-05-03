/** Tipos mínimos para lógica de selección de versión tras refetch (sin acoplar a page.tsx). */
export type VersionRowLite = { version: string; status: string };

export function readApiErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Error desconocido";
  const e = (body as { error?: { message?: string } }).error?.message;
  return e && typeof e === "string" ? e : "Error desconocido";
}

/**
 * Tras yank, la versión pasa a `yanked`: conviene enfocar otra versión publicada si existe.
 * Tras deprecate de versión, se mantiene la selección para seguir viendo metadata.
 */
export function pickVersionAfterRefetch(versions: VersionRowLite[], previousVersion: string | null): string | null {
  if (previousVersion) {
    const row = versions.find((v) => v.version === previousVersion);
    if (row) {
      if (row.status === "yanked") {
        return versions.find((v) => v.status === "published")?.version ?? versions[0]?.version ?? null;
      }
      return previousVersion;
    }
  }
  return versions.find((v) => v.status === "published")?.version ?? versions[0]?.version ?? null;
}

export function stripTarballCacheKeysForArtifact<T>(artifactName: string, cache: Record<string, T>): Record<string, T> {
  const prefix = `${artifactName}@`;
  return Object.fromEntries(Object.entries(cache).filter(([k]) => !k.startsWith(prefix)));
}
