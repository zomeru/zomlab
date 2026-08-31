import { describe, expect, test } from "vitest";
import {
  consumeRealtimeRateLimit,
  getRealtimeHubName,
  isPresenceStale,
  REALTIME_PRESENCE_TIMEOUT_MS,
} from "~/realtime/runtime";

describe("realtime runtime policies", () => {
  test("limits message bursts per connection and resets the window", () => {
    let state = { count: 0, windowStartedAt: 1_000 };
    for (let index = 0; index < 10; index += 1) {
      const result = consumeRealtimeRateLimit(state, 1_500);
      expect(result.allowed).toBe(true);
      state = result.state;
    }
    expect(consumeRealtimeRateLimit(state, 1_500).allowed).toBe(false);
    expect(consumeRealtimeRateLimit(state, 11_000).allowed).toBe(true);
  });

  test("expires presence only after the heartbeat timeout", () => {
    const lastSeen = "2026-08-31T08:00:00.000Z";
    const start = Date.parse(lastSeen);
    expect(isPresenceStale(lastSeen, start + REALTIME_PRESENCE_TIMEOUT_MS)).toBe(false);
    expect(isPresenceStale(lastSeen, start + REALTIME_PRESENCE_TIMEOUT_MS + 1)).toBe(true);
  });

  test("shards rooms and user notification channels independently", () => {
    expect(getRealtimeHubName({ channel: "chat", roomId: "general" }, "user-1")).toBe(
      "chat:general",
    );
    expect(getRealtimeHubName({ channel: "presence", roomId: "demo" }, "user-1")).toBe(
      "presence:demo",
    );
    expect(getRealtimeHubName({ channel: "notifications" }, "user-1")).toBe("notifications:user-1");
  });
});
