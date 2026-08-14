import type { NoteListQuery } from "@zomlab/contracts";

export const queryKeys = {
  files: { all: ["files"] as const },
  health: { all: ["health"] as const },
  notes: {
    all: ["notes"] as const,
    lists: ["notes", "list"] as const,
    list: (query: NoteListQuery) => ["notes", "list", query] as const,
    details: ["notes", "detail"] as const,
    detail: (id: string) => ["notes", "detail", id] as const,
  },
} as const;
