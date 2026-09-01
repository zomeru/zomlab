import type {
  RealtimeChatMessage,
  RealtimeNotification,
  RealtimeNotificationListResponse,
} from "@zomlab/contracts";

export function getReconnectDelay(attempt: number, random = Math.random): number {
  const exponential = Math.min(1_000 * 2 ** Math.max(0, attempt - 1), 30_000);
  const jitter = 0.8 + random() * 0.4;
  return Math.round(exponential * jitter);
}

export function mergeChatMessages(
  history: readonly RealtimeChatMessage[],
  live: readonly RealtimeChatMessage[],
): RealtimeChatMessage[] {
  const messages = new Map<string, RealtimeChatMessage>();
  for (const message of history) messages.set(message.id, message);
  for (const message of live) messages.set(message.id, message);
  return [...messages.values()].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
  );
}

export function mergeNotification(
  current: RealtimeNotificationListResponse | undefined,
  notification: RealtimeNotification,
): RealtimeNotificationListResponse {
  const existing = current?.items.find((item) => item.id === notification.id);
  const items = [
    notification,
    ...(current?.items.filter((item) => item.id !== notification.id) ?? []),
  ].slice(0, 50);
  const unreadDelta = Number(notification.readAt === null) - Number(existing?.readAt === null);
  return {
    items,
    unreadCount: current
      ? Math.max(0, current.unreadCount + unreadDelta)
      : Number(notification.readAt === null),
  };
}

export function markAllNotificationsLocally(
  current: RealtimeNotificationListResponse | undefined,
  readAt: string,
): RealtimeNotificationListResponse | undefined {
  if (!current) return undefined;
  return {
    items: current.items.map((item) => (item.readAt ? item : { ...item, readAt })),
    unreadCount: 0,
  };
}
