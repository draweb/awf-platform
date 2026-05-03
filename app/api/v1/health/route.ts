import { NextResponse } from "next/server";
import { jsonOk } from "@/lib/http/json";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonOk({ status: "ok", db: "up", ts: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "down", ts: new Date().toISOString() },
      { status: 503 },
    );
  }
}
