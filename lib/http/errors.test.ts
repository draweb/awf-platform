import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";

describe("ApiError", () => {
  it("expone código y status", () => {
    const e = new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "x" });
    expect(e.code).toBe("NOT_FOUND");
    expect(e.httpStatus).toBe(404);
  });
});
