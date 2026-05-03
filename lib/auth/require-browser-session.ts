import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth/get-actor";

/**
 * Protege páginas del panel: exige cookie de sesión válida **y** fila Session activa en BD.
 * El middleware solo valida el JWT; esto evita acceso con JWT robado/revocado o sesión expirada en servidor.
 */
export async function requireBrowserSessionOrRedirect(defaultReturnTo: string): Promise<void> {
  const h = await headers();
  const returnTo = h.get("x-awf-return-to") ?? defaultReturnTo;
  const path = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const url = `${proto}://${host}${path}`;
  const request = new NextRequest(new URL(url), { headers: h });
  const actor = await getActor(request);

  if (!actor || actor.authMethod !== "session") {
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
}
