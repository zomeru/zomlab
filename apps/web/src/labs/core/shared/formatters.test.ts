import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, formatDuration } from "./formatters";

describe("Core formatters", () => {
  it("formats comparable values consistently", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatDuration(12.34)).toBe("12.3 ms");
    expect(formatDate("2026-08-13T00:00:00.000Z")).toContain("Aug");
  });
});
