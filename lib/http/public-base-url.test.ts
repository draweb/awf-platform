import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetEnvCacheForTests } from "@/lib/env";
import { publicBaseUrlFromRequest } from "./public-base-url";

beforeEach(() => {
  process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:5432/db";
  process.env.SESSION_SECRET = "12345678901234567890123456789012";
  process.env.NEXT_PUBLIC_APP_URL = "";
  resetEnvCacheForTests();
});

describe("publicBaseUrlFromRequest", () => {
  it("usa cabeceras cuando NEXT_PUBLIC_APP_URL está vacío", () => {
    const req = new NextRequest("http://localhost:3000/x", {
      headers: { host: "localhost:3000" },
    });
    expect(publicBaseUrlFromRequest(req)).toBe("http://localhost:3000");
  });

  it("respeta x-forwarded-proto y x-forwarded-host", () => {
    const req = new NextRequest("http://internal/x", {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "registry.ejemplo.com",
      },
    });
    expect(publicBaseUrlFromRequest(req)).toBe("https://registry.ejemplo.com");
  });

  it("usa NEXT_PUBLIC_APP_URL cuando es URL absoluta válida", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.org/base";
    resetEnvCacheForTests();
    const req = new NextRequest("http://localhost/x");
    expect(publicBaseUrlFromRequest(req)).toBe("https://app.example.org");
  });
});
