import { NextResponse } from "next/server";
import { openApiDocument } from "@awf/api-contract/openapi";

export async function GET() {
  const headers = new Headers();
  headers.set(
    "Cache-Control",
    process.env.NODE_ENV === "production" ? "public, max-age=3600" : "no-store",
  );
  return NextResponse.json(openApiDocument, { headers });
}
