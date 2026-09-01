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

export async function realtimeRoomScopeKey(ownerId: string, roomId: string): Promise<string> {
  const input = new TextEncoder().encode(`${ownerId}\0${roomId}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 48);
}

export function toChronologicalMessages(
  rows: readonly RealtimeChatMessage[],
): RealtimeChatMessage[] {
  return [...rows].reverse();
}

export function createRealtimeRepository() {
  return {
    async createChatMessage(data: {
      id: string;
      ownerId: string;
      roomId: string;
      senderId: string;
      senderName: string;
      content: string;
    }): Promise<RealtimeChatMessage> {
      const { ownerId, roomId, ...message } = data;
      const scopedRoomId = await realtimeRoomScopeKey(ownerId, roomId);
      const [row] = await db
        .insert(realtimeChatMessages)
        .values({ ...message, roomId: scopedRoomId })
        .returning();
      if (!row) throw new Error("Realtime chat message insert did not return a row");
      return { ...serializeDates<RealtimeChatMessageRow>(row), roomId };
    },

    async listChatMessages(ownerId: string, roomId: string): Promise<RealtimeChatMessage[]> {
      const scopedRoomId = await realtimeRoomScopeKey(ownerId, roomId);
      const rows = await db
        .select()
        .from(realtimeChatMessages)
        .where(eq(realtimeChatMessages.roomId, scopedRoomId))
        .orderBy(desc(realtimeChatMessages.createdAt), desc(realtimeChatMessages.id))
        .limit(HISTORY_LIMIT);
      return toChronologicalMessages(
        serializeDates<RealtimeChatMessageRow[]>(rows).map((row) => ({ ...row, roomId })),
      );
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
