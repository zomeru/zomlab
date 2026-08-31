import type { RealtimeNotification, RealtimeServerEvent } from "@zomlab/contracts";
import type { RealtimeRepository } from "@zomlab/database";
import { describe, expect, test } from "vitest";
import {
  createRealtimeService,
  type RealtimePublisher,
} from "~/integration/hono/service/realtime/realtime.service";

function createFixture() {
  const notifications = new Map<string, RealtimeNotification>();
  const operations: string[] = [];
  const published: RealtimeServerEvent[] = [];
  const repository = {
    createChatMessage: async () => {
      throw new Error("Unexpected chat repository call");
    },
    listChatMessages: async () => [],
    async createNotification(data) {
      operations.push("persist");
      const notification: RealtimeNotification = {
        ...data,
        readAt: null,
        createdAt: "2026-08-31T08:00:00.000Z",
      };
      notifications.set(notification.id, notification);
      return notification;
    },
    async listNotifications(recipientId) {
      const items = [...notifications.values()].filter(
        (notification) => notification.recipientId === recipientId,
      );
      return { items, unreadCount: items.filter((item) => item.readAt === null).length };
    },
    async markNotificationRead(recipientId, id, readAt = new Date()) {
      const notification = notifications.get(id);
      if (!notification || notification.recipientId !== recipientId) return undefined;
      const updated = { ...notification, readAt: readAt.toISOString() };
      notifications.set(id, updated);
      return updated;
    },
    async markAllNotificationsRead(recipientId, readAt = new Date()) {
      let updated = 0;
      for (const [id, notification] of notifications) {
        if (notification.recipientId === recipientId && !notification.readAt) {
          notifications.set(id, { ...notification, readAt: readAt.toISOString() });
          updated += 1;
        }
      }
      return { readAt: readAt.toISOString(), updated };
    },
  } satisfies RealtimeRepository;
  const publisher = {
    async publishToUser(_userId, event) {
      operations.push("publish");
      published.push(event);
      return 1;
    },
  } satisfies RealtimePublisher;

  return {
    service: createRealtimeService(repository, publisher),
    operations,
    published,
  };
}

describe("realtime notification service", () => {
  test("persists before publishing the created event", async () => {
    const fixture = createFixture();
    const notification = await fixture.service.generateNotification("user-1", { type: "success" });

    expect(fixture.operations).toEqual(["persist", "publish"]);
    expect(fixture.published[0]).toMatchObject({
      type: "notification.created",
      eventId: notification.id,
      payload: notification,
    });
  });

  test("does not allow one user to read another user's notification", async () => {
    const fixture = createFixture();
    const notification = await fixture.service.generateNotification("user-1", { type: "info" });

    await expect(
      fixture.service.markNotificationRead("user-2", notification.id),
    ).rejects.toMatchObject({ code: "REALTIME_NOTIFICATION_NOT_FOUND", status: 404 });
  });

  test("publishes the authoritative mark-all result", async () => {
    const fixture = createFixture();
    await fixture.service.generateNotification("user-1", { type: "warning" });
    const result = await fixture.service.markAllNotificationsRead("user-1");

    expect(result.updated).toBe(1);
    expect(fixture.published.at(-1)).toMatchObject({
      type: "notifications.read",
      payload: result,
    });
  });
});
