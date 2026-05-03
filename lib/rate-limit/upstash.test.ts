import { describe, expect, it } from "vitest";
import { isUpstashRateLimited } from "./upstash";

describe("isUpstashRateLimited", () => {
  it("sin Upstash no limita", async () => {
    expect(await isUpstashRateLimited("test-key")).toBe(false);
  });
});
