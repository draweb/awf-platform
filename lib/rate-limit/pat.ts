import { clientKeyFromRequest } from "./login";

const buckets = new Map<string, number[]>();

const WINDOW_MS = 60_000;
/** Límite de creación de PAT por ventana (panel). */
const MAX_CREATES_PER_WINDOW = 5;

export function patCreateRateLimitKey(userId: string, request: Request): string {
  return `${userId}:${clientKeyFromRequest(request)}`;
}

export function isPatCreateRateLimited(key: string): boolean {
  const now = Date.now();
  const arr = buckets.get(key) ?? [];
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= MAX_CREATES_PER_WINDOW) {
    buckets.set(key, fresh);
    return true;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return false;
}
