const REPORT_DIMENSIONS = Array.from(
  { length: 240 },
  (_, index) => `dimension-${index.toString().padStart(3, "0")}`,
);

export function runDeferredAnalytics(values: readonly number[]) {
  let checksum = REPORT_DIMENSIONS.length;
  for (const value of values) checksum = (checksum + value * 41) % 1_000_003;
  return checksum;
}
