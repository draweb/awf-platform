/** Scopes sugeridos requeriments §20 */
export const SCOPES = [
  "artifact:read",
  "artifact:write",
  "artifact:publish",
  "artifact:deprecate",
  "tag:write",
  "admin:read",
  "admin:write",
] as const;

export type Scope = (typeof SCOPES)[number];

export function hasScope(scopes: string[], required: Scope): boolean {
  if (scopes.includes("admin:write")) return true;
  return scopes.includes(required);
}
