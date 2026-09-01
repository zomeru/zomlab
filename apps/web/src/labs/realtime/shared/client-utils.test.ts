import type { RealtimeChatMessage, RealtimeNotification } from "@zomlab/contracts";
import { describe, expect, test } from "vitest";
import { getReconnectDelay, mergeChatMessages, mergeNotification } from "./client-utils";

describe("realtime client utilities", () => {
  test("uses bounded exponential reconnect delays with jitter", () => {
    expect(getReconnectDelay(1, () => 0.5)).toBe(1_000);
    expect(getReconnectDelay(4, () => 0.5)).toBe(8_000);
    expect(getReconnectDelay(20, () => 0.5)).toBe(30_000);
    expect(getReconnectDelay(1, () => 0)).toBe(800);
    expect(getReconnectDelay(1, () => 1)).toBe(1_200);
  });

  test("deduplicates chat messages after reconnect replay", () => {
    const message = {
      id: "10000000-0000-4000-8000-000000000000",
      roomId: "general",
      senderId: "user-1",
      senderName: "Ada",
      content: "hello",
      createdAt: "2026-08-31T08:00:00.000Z",
    } satisfies RealtimeChatMessage;

    expect(mergeChatMessages([message], [message])).toEqual([message]);
  });

  test("does not increment unread count for a duplicate notification", () => {
    const notification = {
      id: "20000000-0000-4000-8000-000000000000",
      recipientId: "user-1",
      type: "info",
      title: "Hello",
      message: "World",
      metadata: { source: "realtime-demo", sequence: 1 },
      readAt: null,
      createdAt: "2026-08-31T08:00:00.000Z",
    } satisfies RealtimeNotification;

    expect(mergeNotification({ items: [notification], unreadCount: 1 }, notification)).toEqual({
      items: [notification],
      unreadCount: 1,
    });
  });

  test("preserves unread notifications outside the bounded visible history", () => {
    const notification = {
      id: "20000000-0000-4000-8000-000000000000",
      recipientId: "user-1",
      type: "info",
      title: "Hello",
      message: "World",
      metadata: { source: "realtime-demo", sequence: 1 },
      readAt: null,
      createdAt: "2026-08-31T08:00:00.000Z",
    } satisfies RealtimeNotification;

    expect(mergeNotification({ items: [], unreadCount: 12 }, notification).unreadCount).toBe(13);
    expect(
      mergeNotification(
        { items: [notification], unreadCount: 13 },
        { ...notification, readAt: "2026-08-31T08:01:00.000Z" },
      ).unreadCount,
    ).toBe(12);
  });
});
