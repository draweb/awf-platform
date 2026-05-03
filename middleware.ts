import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionJwt, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";

const PROTECTED_PREFIXES = ["/admin", "/cli/device"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  const returnTo = `${url.pathname}${url.search}`;
  url.pathname = "/login";
  // Limpiar params originales antes de armar el redirect
  url.search = "";
  url.searchParams.set("next", returnTo);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }
  const secret = process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me";
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return buildLoginRedirect(request);
  }
  const payload = await verifySessionJwt(secret, token);
  if (!payload) {
    return buildLoginRedirect(request);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-awf-return-to", `${pathname}${request.nextUrl.search}`);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/cli/device", "/cli/device/:path*"],
};
