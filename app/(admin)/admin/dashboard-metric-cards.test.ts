import { describe, expect, it } from "vitest";
import { utcLast7DayLabels } from "./dashboard-metric-cards";

describe("utcLast7DayLabels", () => {
  it("devuelve 7 etiquetas en orden cronológico UTC", () => {
    const labels = utcLast7DayLabels(new Date("2026-05-10T15:00:00.000Z"));
    expect(labels).toHaveLength(7);
    expect(labels[6]).toMatch(/10/);
  });
});
