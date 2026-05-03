import { ArtifactType } from "@prisma/client";

/** Nombre en API (kebab) → enum Prisma */
const API_TO_PRISMA: Record<string, ArtifactType> = {
  "cursor-rule": ArtifactType.cursor_rule,
  agent: ArtifactType.agent,
  skill: ArtifactType.skill,
  command: ArtifactType.command,
  template: ArtifactType.template,
  script: ArtifactType.script,
  "architecture-guideline": ArtifactType.architecture_guideline,
  "workspace-config": ArtifactType.workspace_config,
  "ci-pipeline": ArtifactType.ci_pipeline,
  "eslint-config": ArtifactType.eslint_config,
  "prettier-config": ArtifactType.prettier_config,
  tsconfig: ArtifactType.tsconfig,
  "docker-config": ArtifactType.docker_config,
  "cursor-hook": ArtifactType.cursor_hook,
};

const PRISMA_TO_API: Record<ArtifactType, string> = Object.fromEntries(
  Object.entries(API_TO_PRISMA).map(([k, v]) => [v, k]),
) as Record<ArtifactType, string>;

/** Valores `type` válidos en query/API (orden estable para selects del panel). */
export const ARTIFACT_TYPES_API: readonly string[] = Object.freeze(Object.keys(API_TO_PRISMA).sort());

export function artifactTypeFromApi(value: string): ArtifactType | null {
  return API_TO_PRISMA[value] ?? null;
}

export function artifactTypeToApi(value: ArtifactType): string {
  return PRISMA_TO_API[value] ?? value;
}
