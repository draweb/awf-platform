/** Evita polling agresivo del CLI (RFC 8628 slow_down). */
const lastPollByDeviceHash = new Map<string, number>();
const MIN_INTERVAL_MS = 5_000;

export function pollTooSoon(deviceCodeHash: string): boolean {
  const now = Date.now();
  const last = lastPollByDeviceHash.get(deviceCodeHash) ?? 0;
  if (now - last < MIN_INTERVAL_MS) return true;
  lastPollByDeviceHash.set(deviceCodeHash, now);
  return false;
}

export function resetPollThrottleForTests(): void {
  lastPollByDeviceHash.clear();
}
