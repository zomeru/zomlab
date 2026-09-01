import type { RealtimeServerEvent, RealtimeWebSocketQuery } from "@zomlab/contracts";

const REALTIME_RATE_LIMIT_COUNT = 10;
const REALTIME_RATE_LIMIT_WINDOW_MS = 10_000;
export const REALTIME_PRESENCE_TIMEOUT_MS = 45_000;
export const REALTIME_PRESENCE_ALARM_MS = 30_000;

export interface RateLimitState {
  count: number;
  windowStartedAt: number;
}

export function consumeRealtimeRateLimit(
  state: RateLimitState,
  now: number,
): { allowed: boolean; state: RateLimitState } {
  if (now - state.windowStartedAt >= REALTIME_RATE_LIMIT_WINDOW_MS) {
    return { allowed: true, state: { count: 1, windowStartedAt: now } };
  }

  const count = state.count + 1;
  return {
    allowed: count <= REALTIME_RATE_LIMIT_COUNT,
    state: { count, windowStartedAt: state.windowStartedAt },
  };
}

export function isPresenceStale(lastSeenAt: string, now: number): boolean {
  return now - Date.parse(lastSeenAt) > REALTIME_PRESENCE_TIMEOUT_MS;
}

export function getRealtimeHubName(query: RealtimeWebSocketQuery, userId: string): string {
  if (query.channel === "notifications") return `notifications:${userId}`;
  if (query.channel === "chat") return `chat:${userId}:${query.roomId}`;
  if (query.channel === "demo") return "demo:websockets";
  return `${query.channel}:${query.roomId}`;
}

export function createEventEnvelope(timestamp = new Date()): {
  eventId: string;
  timestamp: string;
} {
  return { eventId: crypto.randomUUID(), timestamp: timestamp.toISOString() };
}

export function isNotificationEvent(
  event: RealtimeServerEvent,
): event is Extract<
  RealtimeServerEvent,
  { type: "notification.created" | "notification.updated" | "notifications.read" }
> {
  return (
    event.type === "notification.created" ||
    event.type === "notification.updated" ||
    event.type === "notifications.read"
  );
}
