const NAME_RE = /^@[a-z0-9._-]+\/[a-z0-9._@-]+$/i;

export function isValidArtifactName(name: string): boolean {
  if (name.length < 4 || name.length > 214) return false;
  return NAME_RE.test(name.trim());
}

export function assertValidArtifactName(name: string): void {
  if (!isValidArtifactName(name)) {
    throw new Error("Nombre de artefacto inválido (esperado @scope/nombre)");
  }
}
