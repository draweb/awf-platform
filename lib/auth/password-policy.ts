/** Longitud mínima recomendada (panel web). */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Valida una nueva contraseña para el panel. Devuelve mensaje en español o null si ok.
 */
export function validateNewPasswordRules(newPassword: string, currentPassword: string): string | null {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (newPassword === currentPassword) {
    return "La nueva contraseña debe ser distinta de la actual.";
  }
  if (!/[a-zA-Z]/.test(newPassword)) {
    return "Incluí al menos una letra.";
  }
  if (!/[0-9]/.test(newPassword)) {
    return "Incluí al menos un número.";
  }
  return null;
}

/** Puntuación 0–4 para UI (fuerza aproximada). */
export function passwordStrengthScore(password: string): number {
  if (!password.length) return 0;
  let s = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) s++;
  if (password.length >= 16) s++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^a-zA-Z0-9]/.test(password)) s++;
  return Math.min(4, s);
}
