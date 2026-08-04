export const queryKeys = {
  health: () => ["health"] as const,
  version: () => ["version"] as const,
  ready: () => ["ready"] as const,
  notes: () => ["notes"] as const,
  note: (id: string) => ["notes", id] as const,
} as const;
