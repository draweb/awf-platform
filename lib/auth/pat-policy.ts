import type { Scope } from "./scopes";
import { SCOPES } from "./scopes";

export const EXPIRY_PRESETS_DAYS = [30, 60, 90] as const;

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export type PatInputValidation = {
  name: string;
  scopes: string[];
  expiresAt: Date | null;
};

/** Solo nombre (rename o pre-check). */
export function validatePatName(name: string): string | null {
  const n = name.trim();
  if (n.length < 1 || n.length > 128) {
    return "El nombre debe tener entre 1 y 128 caracteres.";
  }
  return null;
}

/** Valida entrada para crear un PAT. Devuelve mensaje en español o null. */
export function validatePatInput(input: PatInputValidation): string | null {
  const nameErr = validatePatName(input.name);
  if (nameErr) return nameErr;
  if (input.scopes.length < 1) {
    return "Elegí al menos un scope.";
  }
  const allowed = new Set<string>(SCOPES);
  for (const s of input.scopes) {
    if (!allowed.has(s)) {
      return `Scope desconocido: ${s}`;
    }
  }
  if (input.expiresAt !== null) {
    const now = new Date();
    if (input.expiresAt.getTime() <= now.getTime()) {
      return "La fecha de expiración debe estar en el futuro.";
    }
  }
  return null;
}

/** Convierte preset de días a fecha de expiración desde ahora (UTC). */
export function expiryFromPresetDays(days: (typeof EXPIRY_PRESETS_DAYS)[number], now = new Date()): Date {
  return addDays(now, days);
}

export function isValidScope(s: string): s is Scope {
  return (SCOPES as readonly string[]).includes(s);
}
