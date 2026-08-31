import type { RealtimeNotificationMetadata, RealtimeNotificationType } from "@zomlab/contracts";
import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "../auth";

export const realtimeChatMessages = pgTable(
  "realtime_chat_messages",
  {
    id: uuid("id").primaryKey(),
    roomId: varchar("room_id", { length: 48 }).notNull(),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Snapshot of the sender name so old messages retain their original attribution. */
    senderName: varchar("sender_name", { length: 80 }).notNull(),
    content: varchar("content", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("realtime_chat_messages_room_id_created_at_idx").on(table.roomId, table.createdAt),
  ],
);

export const realtimeNotifications = pgTable(
  "realtime_notifications",
  {
    id: uuid("id").primaryKey(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).$type<RealtimeNotificationType>().notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    message: varchar("message", { length: 500 }).notNull(),
    /** Bounded demo metadata rendered by the notifications module. */
    metadata: jsonb("metadata").$type<RealtimeNotificationMetadata>().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("realtime_notifications_recipient_id_created_at_idx").on(
      table.recipientId,
      table.createdAt,
    ),
    index("realtime_notifications_recipient_id_read_at_idx").on(table.recipientId, table.readAt),
  ],
);

export type RealtimeChatMessageRow = typeof realtimeChatMessages.$inferSelect;
export type RealtimeNotificationRow = typeof realtimeNotifications.$inferSelect;
