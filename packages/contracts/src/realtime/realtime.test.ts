import { describe, expect, test } from "vitest";
import {
  REALTIME_CHAT_MESSAGE_MAX_LENGTH,
  realtimeClientEventSchema,
  realtimeWebSocketQuerySchema,
} from "./realtime";

describe("realtime client protocol", () => {
  test("trims valid chat messages at the validation boundary", () => {
    const result = realtimeClientEventSchema.parse({ type: "chat.send", body: "  hello  " });
    expect(result).toEqual({ type: "chat.send", body: "hello" });
  });

  test("rejects empty, oversized, structured, and unknown messages", () => {
    expect(realtimeClientEventSchema.safeParse({ type: "chat.send", body: "   " }).success).toBe(
      false,
    );
    expect(
      realtimeClientEventSchema.safeParse({
        type: "chat.send",
        body: "x".repeat(REALTIME_CHAT_MESSAGE_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(
      realtimeClientEventSchema.safeParse({ type: "chat.send", body: { html: "<b>no</b>" } })
        .success,
    ).toBe(false);
    expect(realtimeClientEventSchema.safeParse({ type: "admin.execute" }).success).toBe(false);
  });

  test("requires rooms only for room-scoped channels", () => {
    expect(
      realtimeWebSocketQuerySchema.safeParse({ channel: "chat", roomId: "general" }).success,
    ).toBe(true);
    expect(realtimeWebSocketQuerySchema.safeParse({ channel: "chat" }).success).toBe(false);
    expect(
      realtimeWebSocketQuerySchema.safeParse({ channel: "notifications", roomId: "general" })
        .success,
    ).toBe(false);
  });
});
