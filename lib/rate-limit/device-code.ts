import { clientKeyFromRequest } from "./login";

const buckets = new Map<string, number[]>();

const WINDOW_MS = 60_000;
/** Creación de solicitudes device code por IP (CLI humano). */
const MAX_DEVICE_CODE_CREATES_PER_WINDOW = 20;

export function deviceCodeCreateRateLimitKey(request: Request): string {
  return `device_code:${clientKeyFromRequest(request)}`;
}

export function isDeviceCodeCreateRateLimited(key: string): boolean {
  const now = Date.now();
  const arr = buckets.get(key) ?? [];
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= MAX_DEVICE_CODE_CREATES_PER_WINDOW) {
    buckets.set(key, fresh);
    return true;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return false;
}
