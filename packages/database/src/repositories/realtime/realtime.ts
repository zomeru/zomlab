import type {
  RealtimeChatMessage,
  RealtimeNotification,
  RealtimeNotificationMetadata,
  RealtimeNotificationType,
} from "@zomlab/contracts";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../client";
import {
  type RealtimeChatMessageRow,
  type RealtimeNotificationRow,
  realtimeChatMessages,
  realtimeNotifications,
} from "../../db/schema/realtime";
import { serializeDates } from "../util";

const HISTORY_LIMIT = 50;

export function toChronologicalMessages(
  rows: readonly RealtimeChatMessage[],
): RealtimeChatMessage[] {
  return [...rows].reverse();
}

export function createRealtimeRepository() {
  return {
    async createChatMessage(data: {
      id: string;
      roomId: string;
      senderId: string;
      senderName: string;
      content: string;
    }): Promise<RealtimeChatMessage> {
      const [row] = await db.insert(realtimeChatMessages).values(data).returning();
      if (!row) throw new Error("Realtime chat message insert did not return a row");
      return serializeDates<RealtimeChatMessageRow>(row);
    },

    async listChatMessages(roomId: string): Promise<RealtimeChatMessage[]> {
      const rows = await db
        .select()
        .from(realtimeChatMessages)
        .where(eq(realtimeChatMessages.roomId, roomId))
        .orderBy(desc(realtimeChatMessages.createdAt), desc(realtimeChatMessages.id))
        .limit(HISTORY_LIMIT);
      return toChronologicalMessages(serializeDates<RealtimeChatMessageRow[]>(rows));
    },

    async createNotification(data: {
      id: string;
      recipientId: string;
      type: RealtimeNotificationType;
      title: string;
      message: string;
      metadata: RealtimeNotificationMetadata;
    }): Promise<RealtimeNotification> {
      const [row] = await db.insert(realtimeNotifications).values(data).returning();
      if (!row) throw new Error("Realtime notification insert did not return a row");
      return serializeDates<RealtimeNotificationRow>(row);
    },

    async listNotifications(recipientId: string): Promise<{
      items: RealtimeNotification[];
      unreadCount: number;
    }> {
      const [rows, unreadRows] = await db.batch([
        db
          .select()
          .from(realtimeNotifications)
          .where(eq(realtimeNotifications.recipientId, recipientId))
          .orderBy(desc(realtimeNotifications.createdAt), desc(realtimeNotifications.id))
          .limit(HISTORY_LIMIT),
        db
          .select({ value: count() })
          .from(realtimeNotifications)
          .where(
            and(
              eq(realtimeNotifications.recipientId, recipientId),
              isNull(realtimeNotifications.readAt),
            ),
          ),
      ]);

      return {
        items: serializeDates<RealtimeNotificationRow[]>(rows),
        unreadCount: unreadRows[0]?.value ?? 0,
      };
    },

    async markNotificationRead(
      recipientId: string,
      id: string,
      readAt = new Date(),
    ): Promise<RealtimeNotification | undefined> {
      const [row] = await db
        .update(realtimeNotifications)
        .set({ readAt })
        .where(
          and(eq(realtimeNotifications.id, id), eq(realtimeNotifications.recipientId, recipientId)),
        )
        .returning();
      return row ? serializeDates<RealtimeNotificationRow>(row) : undefined;
    },

    async markAllNotificationsRead(
      recipientId: string,
      readAt = new Date(),
    ): Promise<{ readAt: string; updated: number }> {
      const rows = await db
        .update(realtimeNotifications)
        .set({ readAt })
        .where(
          and(
            eq(realtimeNotifications.recipientId, recipientId),
            isNull(realtimeNotifications.readAt),
          ),
        )
        .returning({ id: realtimeNotifications.id });
      return { readAt: readAt.toISOString(), updated: rows.length };
    },
  };
}

export type RealtimeRepository = ReturnType<typeof createRealtimeRepository>;
