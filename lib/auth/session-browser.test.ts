import { describe, it, expect } from "vitest";
import { BROWSER_SESSION_MAX_DAYS } from "./browser-session-policy";

describe("BROWSER_SESSION_MAX_DAYS", () => {
  it("dura al menos un año (365 días)", () => {
    expect(BROWSER_SESSION_MAX_DAYS).toBeGreaterThanOrEqual(365);
  });
});
