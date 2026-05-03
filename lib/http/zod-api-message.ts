import type { ZodError } from "zod";

/**
 * Primer issue de Zod en español para APIs — evita el genérico "Body inválido".
 */
export function formatZodErrorForApi(err: ZodError): { message: string; details: ReturnType<ZodError["flatten"]> } {
  const issue = err.issues[0];
  const pathStr = issue?.path?.length ? issue.path.map(String).join(".") : "body";
  const hint = issue?.message ?? "valor inválido";
  const message = `Validación — ${pathStr}: ${hint}`;
  return { message, details: err.flatten() };
}
