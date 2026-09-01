import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "../auth";

function performanceRecordColumns() {
  return {
    id: text("id").primaryKey(),
    ownerId: varchar("owner_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lookupKey: varchar("lookup_key", { length: 255 }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    details: text("details").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  };
}

export const performanceRecordsBefore = pgTable(
  "performance_records_before",
  performanceRecordColumns(),
  (table) => ({
    ownerIdIdx: index("performance_records_before_owner_id_idx").on(table.ownerId),
  }),
);

export const performanceRecordsAfter = pgTable(
  "performance_records_after",
  performanceRecordColumns(),
  (table) => ({
    lookupIdx: index("performance_records_after_owner_lookup_idx").on(
      table.ownerId,
      table.lookupKey,
    ),
  }),
);

export type PerformanceRecordInsert = typeof performanceRecordsBefore.$inferInsert;
