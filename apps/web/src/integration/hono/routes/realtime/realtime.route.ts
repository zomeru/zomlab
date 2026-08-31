import { env } from "cloudflare:workers";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  generateRealtimeNotificationBodySchema,
  markAllRealtimeNotificationsReadResponseSchema,
  type RealtimeServerEvent,
  realtimeChatListQuerySchema,
  realtimeChatListResponseSchema,
  realtimeNotificationListResponseSchema,
  realtimeNotificationParamsSchema,
  realtimeNotificationSchema,
  realtimeWebSocketQuerySchema,
} from "@zomlab/contracts";
import { createRealtimeRepository } from "@zomlab/database";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { streamSSE } from "hono/streaming";
import { apiErrorHandler } from "~/integration/hono/errors/error-handler";
import { requireAuth } from "~/integration/hono/middleware/auth.middleware";
import {
  createRealtimeService,
  type RealtimePublisher,
} from "~/integration/hono/service/realtime/realtime.service";
import type { HonoEnv } from "~/integration/hono/types";
import { getRealtimeHubName } from "~/realtime/runtime";

function publishToUser(userId: string, event: RealtimeServerEvent): Promise<number> {
  return env.REALTIME_HUB.getByName(`notifications:${userId}`).publishNotification(event);
}

const realtimeService = createRealtimeService(createRealtimeRepository(), {
  publishToUser,
} satisfies RealtimePublisher);

function ensureSameOriginWebSocket(request: Request): void {
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    throw new HTTPException(426, { message: "Expected a WebSocket upgrade" });
  }

  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new HTTPException(403, { message: "WebSocket origin is not allowed" });
  }
}

function internalWebSocketRequest(
  query: ReturnType<typeof realtimeWebSocketQuerySchema.parse>,
  user: { id: string; name: string },
): Request {
  const headers = new Headers({
    Upgrade: "websocket",
    "x-zomlab-realtime-channel": query.channel,
    "x-zomlab-realtime-user-id": user.id,
    "x-zomlab-realtime-user-name": encodeURIComponent(user.name.trim().slice(0, 80) || "Member"),
  });
  if (query.roomId) headers.set("x-zomlab-realtime-room", query.roomId);
  return new Request("https://realtime.internal/connect", { headers });
}

function parseLastEventId(value: string | undefined): number {
  if (!value || !/^\d{1,12}$/u.test(value)) return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

function randomNumber(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return (values[0] ?? 0) % 100;
}

async function handleWebSocket(c: Context<HonoEnv>): Promise<Response> {
  ensureSameOriginWebSocket(c.req.raw);
  const query = realtimeWebSocketQuerySchema.parse(c.req.query());
  const hub = env.REALTIME_HUB.getByName(getRealtimeHubName(query, c.var.user.id));
  return hub.fetch(internalWebSocketRequest(query, c.var.user));
}

function handleSse(c: Context<HonoEnv>): Response {
  const lastEventId = parseLastEventId(c.req.header("Last-Event-ID") ?? c.req.query("lastEventId"));
  c.header("Cache-Control", "private, no-store");
  c.header("Pragma", "no-cache");
  c.header("Content-Encoding", "Identity");
  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    let running = true;
    let id = lastEventId;
    stream.onAbort(() => {
      running = false;
    });

    id += 1;
    await stream.writeSSE({
      data: JSON.stringify({ resumedAfter: lastEventId || null }),
      event: "connected",
      id: String(id),
      retry: 1_500,
    });

    let index = 0;
    const eventNames = ["heartbeat", "random-number", "server-time"] as const;
    while (running && !stream.aborted) {
      await stream.sleep(1_500);
      if (!running || stream.aborted) break;
      const timestamp = new Date().toISOString();
      const event = eventNames[index % eventNames.length] ?? "heartbeat";
      index += 1;
      id += 1;
      const data =
        event === "random-number"
          ? { value: randomNumber(), timestamp }
          : event === "server-time"
            ? { timestamp }
            : { timestamp, kind: "application-heartbeat" };
      await stream.writeSSE({ data: JSON.stringify(data), event, id: String(id) });
    }
  });
}

const app = new OpenAPIHono<HonoEnv>({
  defaultHook: (result, c) => {
    if (!result.success) return apiErrorHandler(result.error, c);
  },
})
  .openapi(
    createRoute({
      method: "get",
      path: "/chat/messages",
      middleware: [requireAuth] as const,
      request: { query: realtimeChatListQuerySchema },
      responses: {
        200: {
          description: "Recent messages for a realtime chat room",
          content: { "application/json": { schema: realtimeChatListResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { roomId } = c.req.valid("query");
      return c.json({ roomId, items: await realtimeService.listChatMessages(roomId) });
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/notifications",
      middleware: [requireAuth] as const,
      responses: {
        200: {
          description: "Recent notifications for the authenticated user",
          content: { "application/json": { schema: realtimeNotificationListResponseSchema } },
        },
      },
    }),
    async (c) => c.json(await realtimeService.listNotifications(c.var.user.id)),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/notifications/demo",
      middleware: [requireAuth] as const,
      request: {
        body: {
          content: { "application/json": { schema: generateRealtimeNotificationBodySchema } },
        },
      },
      responses: {
        201: {
          description: "Persisted demo notification",
          content: { "application/json": { schema: realtimeNotificationSchema } },
        },
      },
    }),
    async (c) =>
      c.json(await realtimeService.generateNotification(c.var.user.id, c.req.valid("json")), 201),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/notifications/read-all",
      middleware: [requireAuth] as const,
      responses: {
        200: {
          description: "All unread notifications marked read",
          content: {
            "application/json": { schema: markAllRealtimeNotificationsReadResponseSchema },
          },
        },
      },
    }),
    async (c) => c.json(await realtimeService.markAllNotificationsRead(c.var.user.id)),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/notifications/{id}/read",
      middleware: [requireAuth] as const,
      request: { params: realtimeNotificationParamsSchema },
      responses: {
        200: {
          description: "Notification marked read",
          content: { "application/json": { schema: realtimeNotificationSchema } },
        },
      },
    }),
    async (c) =>
      c.json(await realtimeService.markNotificationRead(c.var.user.id, c.req.valid("param").id)),
  )
  .get("/ws", requireAuth, handleWebSocket)
  .get("/sse", requireAuth, handleSse);

export default app;
