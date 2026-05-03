import { valid as semverValid } from "semver";

/** Slug estable: min 2, max 64, solo minúsculas, dígitos y guiones. */
export const WORKSPACE_SLUG_REGEX = /^[a-z0-9-]{2,64}$/;

export const MAX_WORKSPACE_NAME_LEN = 128;
export const MAX_WORKSPACE_DESCRIPTION_LEN = 1024;
export const MAX_WORKSPACE_RAW_MARKDOWN_LEN = 65_536;

/** Stacks de alto nivel permitidos en API (catálogo cerrado). */
export const WORKSPACE_STACK_CATALOG = [
  "nextjs",
  "react",
  "vue",
  "angular",
  "svelte",
  "nodejs",
  "typescript",
  "javascript",
  "tailwind",
  "prisma",
  "postgres",
  "vitest",
  "jest",
  "eslint",
  "docker",
  "vercel",
  "pnpm",
  "npm",
] as const;

export type WorkspaceStackId = (typeof WORKSPACE_STACK_CATALOG)[number];

export function isValidWorkspaceSlug(slug: string): boolean {
  return WORKSPACE_SLUG_REGEX.test(slug);
}

export function isValidWorkspaceSemver(v: string): boolean {
  return semverValid(v) !== null;
}

export function suggestSlugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  if (base.length >= 2) return base;
  if (base.length === 1) return `${base}x`;
  return "workspace";
}

export function validateStacks(stacks: string[]): { ok: true } | { ok: false; invalid: string[] } {
  const set = new Set<string>(WORKSPACE_STACK_CATALOG);
  const invalid = stacks.filter((s) => !set.has(s));
  if (invalid.length) return { ok: false, invalid };
  return { ok: true };
}

/** Vacío o solo guiones/espacios/guiones largos (p. ej. "---", "–"). */
export function isWorkspaceLabelPlaceholder(value: string): boolean {
  const t = value.trim();
  if (!t) return true;
  return /^[\s\-–—_]+$/.test(t);
}

/** Nombre útil para guardado/UI: ignora placeholders en nombre y cae al slug. */
export function resolveWorkspaceIdentityLabel(name: string, slug: string): string {
  const n = name.trim();
  const s = slug.trim();
  if (!isWorkspaceLabelPlaceholder(n)) return n;
  if (!isWorkspaceLabelPlaceholder(s)) return s;
  return "";
}
