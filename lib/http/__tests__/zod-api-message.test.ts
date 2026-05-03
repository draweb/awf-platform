import { describe, it, expect } from "vitest";
import { z } from "zod";
import { formatZodErrorForApi } from "../zod-api-message";

describe("formatZodErrorForApi", () => {
  it("includes path and message from first issue", () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const { message, details } = formatZodErrorForApi(result.error);
      expect(message).toContain("name");
      expect(message).toContain("Validación");
      expect(details.fieldErrors.name?.length).toBeGreaterThan(0);
    }
  });
});
