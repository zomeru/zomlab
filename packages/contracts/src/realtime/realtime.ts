import { z } from "zod";

export const REALTIME_MAX_PAYLOAD_BYTES = 16_384;
export const REALTIME_EVENT_LOG_LIMIT = 100;
export const REALTIME_CHAT_HISTORY_LIMIT = 50;
export const REALTIME_CHAT_MESSAGE_MAX_LENGTH = 500;
export const REALTIME_ROOM_MAX_LENGTH = 48;

export const realtimeChannelSchema = z.enum(["demo", "chat", "presence", "notifications"]);
export const realtimeRoomIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(REALTIME_ROOM_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Use lowercase letters, numbers, and hyphens");

export const realtimeUserSchema = z.strictObject({
  id: z.string().min(1).max(255),
  name: z.string().trim().min(1).max(80),
});

export const realtimeWebSocketQuerySchema = z
  .strictObject({
    channel: realtimeChannelSchema,
    roomId: realtimeRoomIdSchema.optional(),
  })
  .superRefine((value, context) => {
    const roomRequired = value.channel === "chat" || value.channel === "presence";
    if (roomRequired && !value.roomId) {
      context.addIssue({
        code: "custom",
        message: `roomId is required for ${value.channel} connections`,
        path: ["roomId"],
      });
    }
    if (!roomRequired && value.roomId) {
      context.addIssue({
        code: "custom",
        message: `roomId is not allowed for ${value.channel} connections`,
        path: ["roomId"],
      });
    }
  });

const chatBodySchema = z
  .string()
  .trim()
  .min(1, "Enter a message")
  .max(REALTIME_CHAT_MESSAGE_MAX_LENGTH);

export const realtimeClientEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("connection.ping"),
    nonce: z.uuid(),
  }),
  z.strictObject({
    type: z.literal("demo.message"),
    body: chatBodySchema,
  }),
  z.strictObject({
    type: z.literal("demo.broadcast"),
  }),
  z.strictObject({
    type: z.literal("chat.send"),
    body: chatBodySchema,
  }),
  z.strictObject({
    type: z.literal("presence.heartbeat"),
  }),
]);

export const realtimeChatMessageSchema = z.strictObject({
  id: z.uuid(),
  roomId: realtimeRoomIdSchema,
  senderId: z.string().min(1).max(255),
  senderName: z.string().min(1).max(80),
  content: z.string().min(1).max(REALTIME_CHAT_MESSAGE_MAX_LENGTH),
  createdAt: z.iso.datetime(),
});

export const realtimeChatListQuerySchema = z.strictObject({
  roomId: realtimeRoomIdSchema,
});

export const realtimeChatListResponseSchema = z.strictObject({
  roomId: realtimeRoomIdSchema,
  items: z.array(realtimeChatMessageSchema).max(REALTIME_CHAT_HISTORY_LIMIT),
});

export const realtimePresenceSessionSchema = z.strictObject({
  connectionId: z.uuid(),
  user: realtimeUserSchema,
  connectedAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
});

export const realtimeNotificationTypeSchema = z.enum(["info", "success", "warning"]);
export const realtimeNotificationMetadataSchema = z.strictObject({
  source: z.literal("realtime-demo"),
  sequence: z.number().int().min(1),
});

export const realtimeNotificationSchema = z.strictObject({
  id: z.uuid(),
  recipientId: z.string().min(1).max(255),
  type: realtimeNotificationTypeSchema,
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  metadata: realtimeNotificationMetadataSchema,
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const realtimeNotificationListResponseSchema = z.strictObject({
  items: z.array(realtimeNotificationSchema).max(REALTIME_CHAT_HISTORY_LIMIT),
  unreadCount: z.number().int().min(0),
});

export const generateRealtimeNotificationBodySchema = z.strictObject({
  type: realtimeNotificationTypeSchema.default("info"),
});

export const realtimeNotificationParamsSchema = z.strictObject({ id: z.uuid() });
export const markAllRealtimeNotificationsReadResponseSchema = z.strictObject({
  readAt: z.iso.datetime(),
  updated: z.number().int().min(0),
});

const eventEnvelopeSchema = z.strictObject({
  eventId: z.uuid(),
  timestamp: z.iso.datetime(),
});

export const realtimeServerEventSchema = z.discriminatedUnion("type", [
  eventEnvelopeSchema.extend({
    type: z.literal("connection.ready"),
    connectionId: z.uuid(),
    channel: realtimeChannelSchema,
    roomId: realtimeRoomIdSchema.nullable(),
    user: realtimeUserSchema,
    connectedAt: z.iso.datetime(),
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("connection.pong"),
    nonce: z.uuid(),
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("connection.joined"),
    connectionId: z.uuid(),
    user: realtimeUserSchema,
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("connection.left"),
    connectionId: z.uuid(),
    user: realtimeUserSchema,
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("demo.message"),
    id: z.uuid(),
    body: z.string().min(1).max(REALTIME_CHAT_MESSAGE_MAX_LENGTH),
    sender: z.strictObject({
      kind: z.enum(["client", "server"]),
      connectionId: z.uuid().nullable(),
      name: z.string().min(1).max(80),
    }),
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("chat.message"),
    payload: realtimeChatMessageSchema,
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("chat.presence"),
    online: z.number().int().min(0),
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("presence.join"),
    payload: realtimePresenceSessionSchema,
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("presence.leave"),
    payload: realtimePresenceSessionSchema,
    reason: z.enum(["closed", "timeout", "error"]),
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("presence.sync"),
    payload: z.strictObject({
      sessions: z.array(realtimePresenceSessionSchema),
    }),
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("notification.created"),
    payload: realtimeNotificationSchema,
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("notification.updated"),
    payload: realtimeNotificationSchema,
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("notifications.read"),
    payload: markAllRealtimeNotificationsReadResponseSchema,
  }),
  eventEnvelopeSchema.extend({
    type: z.literal("protocol.error"),
    code: z.enum(["INVALID_MESSAGE", "MESSAGE_TOO_LARGE", "RATE_LIMITED", "SERVER_ERROR"]),
    message: z.string().min(1).max(200),
  }),
]);

export type RealtimeChannel = z.infer<typeof realtimeChannelSchema>;
export type RealtimeUser = z.infer<typeof realtimeUserSchema>;
export type RealtimeWebSocketQuery = z.infer<typeof realtimeWebSocketQuerySchema>;
export type RealtimeClientEvent = z.infer<typeof realtimeClientEventSchema>;
export type RealtimeServerEvent = z.infer<typeof realtimeServerEventSchema>;
export type RealtimeChatMessage = z.infer<typeof realtimeChatMessageSchema>;
export type RealtimeChatListResponse = z.infer<typeof realtimeChatListResponseSchema>;
export type RealtimePresenceSession = z.infer<typeof realtimePresenceSessionSchema>;
export type RealtimeNotificationType = z.infer<typeof realtimeNotificationTypeSchema>;
export type RealtimeNotificationMetadata = z.infer<typeof realtimeNotificationMetadataSchema>;
export type RealtimeNotification = z.infer<typeof realtimeNotificationSchema>;
export type RealtimeNotificationListResponse = z.infer<
  typeof realtimeNotificationListResponseSchema
>;
export type GenerateRealtimeNotificationBody = z.infer<
  typeof generateRealtimeNotificationBodySchema
>;
export type MarkAllRealtimeNotificationsReadResponse = z.infer<
  typeof markAllRealtimeNotificationsReadResponseSchema
>;
