import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Origen público para links (device login, redirects). Preferir NEXT_PUBLIC_APP_URL;
 * si falta o es inválida, usar cabeceras del request (Vercel / proxy).
 */
export function publicBaseUrlFromRequest(request: NextRequest): string {
  const fromEnv = env().NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      /* continuar con headers */
    }
  }
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (request.nextUrl.protocol === "https:" ? "https" : "http");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host") ??
    "localhost:3000";
  return `${proto}://${host}`;
}
