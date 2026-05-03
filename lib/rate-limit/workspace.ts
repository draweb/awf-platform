import { clientKeyFromRequest } from "./login";

const buckets = new Map<string, number[]>();

const WINDOW_MS = 60_000;
/** Límite POST/PATCH workspaces por ventana (usuario + IP aproximada). */
const MAX_MUTATIONS_PER_WINDOW = 5;

export function workspaceMutationRateLimitKey(userId: string, request: Request): string {
  return `workspace:${userId}:${clientKeyFromRequest(request)}`;
}

export function isWorkspaceMutationRateLimited(key: string): boolean {
  const now = Date.now();
  const arr = buckets.get(key) ?? [];
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= MAX_MUTATIONS_PER_WINDOW) {
    buckets.set(key, fresh);
    return true;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return false;
}
