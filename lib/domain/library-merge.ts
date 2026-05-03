/**
 * Merge de artefactos de bibliotecas + artefactos directos de un workspace.
 *
 * Prioridad:
 *   1. Artefactos directos (`WorkspaceArtifact`) siempre ganan.
 *   2. Bibliotecas se procesan en orden de `WorkspaceLibrary.order`;
 *      dentro de cada biblioteca, los artefactos se recorren por `LibraryArtifact.order`.
 *   3. Primera aparición gana: si un artifactId ya fue visto, se ignora en bibliotecas posteriores.
 */

export type MergeInputDirect = {
  artifactId: string;
  pinnedVersion: string | null;
  order: number;
  artifactName: string;
};

export type MergeInputLibrary = {
  libraryOrder: number;
  artifacts: {
    artifactId: string;
    pinnedVersion: string | null;
    order: number;
    artifactName: string;
  }[];
};

export type MergedArtifact = {
  artifactId: string;
  pinnedVersion: string | null;
  artifactName: string;
};

export function resolveMergedWorkspaceArtifacts(
  directArtifacts: MergeInputDirect[],
  libraries: MergeInputLibrary[],
): MergedArtifact[] {
  const seen = new Set<string>();
  const result: MergedArtifact[] = [];

  const sorted = [...directArtifacts].sort((a, b) => a.order - b.order);
  for (const d of sorted) {
    if (seen.has(d.artifactId)) continue;
    seen.add(d.artifactId);
    result.push({
      artifactId: d.artifactId,
      pinnedVersion: d.pinnedVersion,
      artifactName: d.artifactName,
    });
  }

  const sortedLibs = [...libraries].sort((a, b) => a.libraryOrder - b.libraryOrder);
  for (const lib of sortedLibs) {
    const sortedArts = [...lib.artifacts].sort((a, b) => a.order - b.order);
    for (const a of sortedArts) {
      if (seen.has(a.artifactId)) continue;
      seen.add(a.artifactId);
      result.push({
        artifactId: a.artifactId,
        pinnedVersion: a.pinnedVersion,
        artifactName: a.artifactName,
      });
    }
  }

  return result;
}
