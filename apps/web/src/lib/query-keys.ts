export const queryKeys = {
  health: () => ["health"] as const,
  version: () => ["version"] as const,
  ready: () => ["ready"] as const,
} as const;
