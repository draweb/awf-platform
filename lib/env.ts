import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL requerido"),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET debe tener al menos 16 caracteres")
    .default("dev-insecure-secret-change-me"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
  /** Límite de tamaño del tarball en POST /versions (bytes). Default 50 MiB. */
  AWF_MAX_TARBALL_BYTES: z.coerce.number().int().positive().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    AWF_MAX_TARBALL_BYTES: process.env.AWF_MAX_TARBALL_BYTES,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Variables de entorno inválidas: ${msg}`);
  }
  return parsed.data;
}

let cached: Env | null = null;

export function env(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}

export function resetEnvCacheForTests(): void {
  cached = null;
}
