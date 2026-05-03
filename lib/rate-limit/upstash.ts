import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!ratelimit) {
    const redis = new Redis({ url, token });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      prefix: "awf:rl",
    });
  }
  return ratelimit;
}

/** Devuelve true si se excedió el límite (429). Sin env Upstash, no limita. */
export async function isUpstashRateLimited(identifier: string): Promise<boolean> {
  const rl = getLimiter();
  if (!rl) return false;
  const { success } = await rl.limit(identifier);
  return !success;
}
