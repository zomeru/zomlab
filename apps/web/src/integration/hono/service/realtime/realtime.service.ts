import type {
  GenerateRealtimeNotificationBody,
  MarkAllRealtimeNotificationsReadResponse,
  RealtimeNotification,
  RealtimeNotificationListResponse,
  RealtimeServerEvent,
} from "@zomlab/contracts";
import type { RealtimeRepository as DatabaseRealtimeRepository } from "@zomlab/database";
import { RealtimeNotificationNotFoundError } from "~/integration/hono/errors/api-error";

export interface RealtimePublisher {
  publishToUser(userId: string, event: RealtimeServerEvent): Promise<number>;
}

export interface RealtimeService {
  listChatMessages(
    userId: string,
    roomId: string,
  ): ReturnType<DatabaseRealtimeRepository["listChatMessages"]>;
  listNotifications(userId: string): Promise<RealtimeNotificationListResponse>;
  generateNotification(
    userId: string,
    data: GenerateRealtimeNotificationBody,
  ): Promise<RealtimeNotification>;
  markNotificationRead(userId: string, id: string): Promise<RealtimeNotification>;
  markAllNotificationsRead(userId: string): Promise<MarkAllRealtimeNotificationsReadResponse>;
}

const notificationCopy = {
  info: {
    title: "New realtime event",
    message: "A test event was delivered through your authenticated user channel.",
  },
  success: {
    title: "Demo operation completed",
    message: "The server persisted this notification before publishing it in realtime.",
  },
  warning: {
    title: "Connection check requested",
    message: "This warning demonstrates typed notification variants and metadata.",
  },
} as const;

export function createRealtimeService(
  repository: DatabaseRealtimeRepository,
  publisher: RealtimePublisher,
): RealtimeService {
  return {
    async listChatMessages(userId, roomId) {
      return repository.listChatMessages(userId, roomId);
    },

    async listNotifications(userId) {
      return repository.listNotifications(userId);
    },

    async generateNotification(userId, data) {
      const copy = notificationCopy[data.type];
      const notification = await repository.createNotification({
        id: crypto.randomUUID(),
        recipientId: userId,
        type: data.type,
        title: copy.title,
        message: copy.message,
        metadata: { source: "realtime-demo", sequence: Date.now() },
      });
      await publisher.publishToUser(userId, {
        eventId: notification.id,
        timestamp: notification.createdAt,
        type: "notification.created",
        payload: notification,
      });
      return notification;
    },

    async markNotificationRead(userId, id) {
      const notification = await repository.markNotificationRead(userId, id);
      if (!notification) throw new RealtimeNotificationNotFoundError();
      await publisher.publishToUser(userId, {
        eventId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: "notification.updated",
        payload: notification,
      });
      return notification;
    },

    async markAllNotificationsRead(userId) {
      const result = await repository.markAllNotificationsRead(userId);
      await publisher.publishToUser(userId, {
        eventId: crypto.randomUUID(),
        timestamp: result.readAt,
        type: "notifications.read",
        payload: result,
      });
      return result;
    },
  };
}
