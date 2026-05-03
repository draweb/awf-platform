import { NextResponse } from "next/server";

/**
 * Placeholder: sesión basada en JWT con expiración en cookie; refresh explícito pendiente de producto.
 */
export async function POST() {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Usar POST /api/v1/auth/login" } },
    { status: 501 },
  );
}
