import type { PerformanceDatasetSize } from "@zomlab/contracts";
import type { PerformanceRecordInsert } from "../../db/schema/performance";

export function performanceLookupKey(index: number): string {
  return `record-${index.toString().padStart(5, "0")}@example.test`;
}

export function createPerformanceSeedRows(
  ownerId: string,
  size: PerformanceDatasetSize,
  createdAt = new Date("2025-01-01T00:00:00.000Z"),
): PerformanceRecordInsert[] {
  return Array.from({ length: size }, (_, index) => ({
    category: `group-${index % 17}`,
    createdAt,
    details: `Synthetic performance record ${index}. This isolated text makes over-fetching measurable without using application data.`,
    id: `${ownerId}:performance:${index}`,
    label: `Performance record ${index.toString().padStart(5, "0")}`,
    lookupKey: performanceLookupKey(index),
    ownerId,
    score: (index * 37) % 1_003,
  }));
}
