import { describe, expect, test } from "vitest";
import { createPerformanceSeedRows, performanceLookupKey } from "./data";

describe("performance dataset", () => {
  test("builds deterministic, owner-isolated rows", () => {
    const rows = createPerformanceSeedRows("user-1", 1_000);

    expect(rows).toHaveLength(1_000);
    expect(rows[0]).toMatchObject({
      id: "user-1:performance:0",
      lookupKey: "record-00000@example.test",
      ownerId: "user-1",
    });
    expect(rows[999]?.lookupKey).toBe("record-00999@example.test");
  });

  test("pads lookup keys so database ordering is stable", () => {
    expect(performanceLookupKey(42)).toBe("record-00042@example.test");
  });
});
