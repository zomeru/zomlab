export function runEagerAnalytics(values: readonly number[]) {
  let checksum = 0;
  for (const value of values) checksum = (checksum + value * 41) % 1_000_003;
  return checksum;
}
