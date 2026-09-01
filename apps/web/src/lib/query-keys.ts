import type { NoteListQuery, PaymentProvider } from "@zomlab/contracts";

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
  payments: {
    all: ["payments"] as const,
    configuration: ["payments", "configuration"] as const,
    transactions: (provider?: PaymentProvider) => ["payments", "transactions", provider] as const,
    status: (provider: PaymentProvider, referenceId: string) =>
      ["payments", "status", provider, referenceId] as const,
    webhooks: ["payments", "webhooks"] as const,
    webhook: (id: string) => ["payments", "webhooks", id] as const,
    idempotency: ["payments", "idempotency"] as const,
  },
  realtime: {
    chat: (roomId: string) => ["realtime", "chat", roomId] as const,
    notifications: ["realtime", "notifications"] as const,
  },
} as const;
