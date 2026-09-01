import { DurableObject } from "cloudflare:workers";
import {
  REALTIME_MAX_PAYLOAD_BYTES,
  type RealtimePresenceSession,
  type RealtimeServerEvent,
  realtimeChannelSchema,
  realtimeClientEventSchema,
  realtimeRoomIdSchema,
  realtimeServerEventSchema,
  realtimeUserSchema,
} from "@zomlab/contracts";
import { createRealtimeRepository } from "@zomlab/database";
import { z } from "zod";
import {
  consumeRealtimeRateLimit,
  createEventEnvelope,
  isNotificationEvent,
  isPresenceStale,
  REALTIME_PRESENCE_ALARM_MS,
} from "~/realtime/runtime";

const attachmentSchema = z.strictObject({
  connectionId: z.uuid(),
  channel: realtimeChannelSchema,
  roomId: realtimeRoomIdSchema.nullable(),
  user: realtimeUserSchema,
  connectedAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
  rateLimitCount: z.number().int().min(0),
  rateLimitWindowStartedAt: z.number().int().min(0),
  active: z.boolean(),
});

type ConnectionAttachment = z.infer<typeof attachmentSchema>;
type PresenceLeaveReason = Extract<RealtimeServerEvent, { type: "presence.leave" }>["reason"];

const textEncoder = new TextEncoder();

function parseAttachment(webSocket: WebSocket): ConnectionAttachment | undefined {
  const parsed = attachmentSchema.safeParse(webSocket.deserializeAttachment());
  return parsed.success ? parsed.data : undefined;
}

function sendEvent(webSocket: WebSocket, event: RealtimeServerEvent): boolean {
  if (webSocket.readyState !== WebSocket.OPEN) return false;
  try {
    webSocket.send(JSON.stringify(event));
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "realtime websocket send failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    );
    return false;
  }
}

function internalConnectionInput(request: Request) {
  const channel = realtimeChannelSchema.parse(request.headers.get("x-zomlab-realtime-channel"));
  const roomHeader = request.headers.get("x-zomlab-realtime-room");
  const roomId = roomHeader ? realtimeRoomIdSchema.parse(roomHeader) : null;
  const user = realtimeUserSchema.parse({
    id: request.headers.get("x-zomlab-realtime-user-id"),
    name: decodeURIComponent(request.headers.get("x-zomlab-realtime-user-name") ?? ""),
  });

  if ((channel === "chat" || channel === "presence") !== Boolean(roomId)) {
    throw new Error("Invalid internal realtime channel scope");
  }

  return { channel, roomId, user };
}

export class RealtimeHub extends DurableObject<Cloudflare.Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }

    let input: ReturnType<typeof internalConnectionInput>;
    try {
      input = internalConnectionInput(request);
    } catch {
      return new Response("Invalid realtime connection", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    if (!client || !server) {
      return new Response("WebSocket pair could not be created", { status: 500 });
    }
    const now = new Date();
    const attachment: ConnectionAttachment = {
      connectionId: crypto.randomUUID(),
      channel: input.channel,
      roomId: input.roomId,
      user: input.user,
      connectedAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      rateLimitCount: 0,
      rateLimitWindowStartedAt: now.getTime(),
      active: true,
    };

    this.ctx.acceptWebSocket(server, [input.channel, `user:${input.user.id}`]);
    server.serializeAttachment(attachment);

    sendEvent(server, {
      ...createEventEnvelope(now),
      type: "connection.ready",
      connectionId: attachment.connectionId,
      channel: attachment.channel,
      roomId: attachment.roomId,
      user: attachment.user,
      connectedAt: attachment.connectedAt,
    });

    if (attachment.channel === "demo") {
      this.broadcast({
        ...createEventEnvelope(now),
        type: "connection.joined",
        connectionId: attachment.connectionId,
        user: attachment.user,
      });
    }

    if (attachment.channel === "presence") {
      this.broadcast({
        ...createEventEnvelope(now),
        type: "presence.join",
        payload: this.toPresenceSession(attachment),
      });
      this.broadcastPresenceSync(now);
      await this.ensurePresenceAlarm(now.getTime());
    }

    if (attachment.channel === "chat") {
      this.broadcast({
        ...createEventEnvelope(now),
        type: "chat.presence",
        online: this.activeSockets().length,
      });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(webSocket: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    const attachment = parseAttachment(webSocket);
    if (!attachment?.active) {
      webSocket.close(1011, "Connection state unavailable");
      return;
    }

    if (
      typeof rawMessage !== "string" ||
      textEncoder.encode(rawMessage).byteLength > REALTIME_MAX_PAYLOAD_BYTES
    ) {
      this.sendProtocolError(
        webSocket,
        "MESSAGE_TOO_LARGE",
        `Messages must be UTF-8 JSON under ${REALTIME_MAX_PAYLOAD_BYTES} bytes`,
      );
      webSocket.close(1009, "Message too large");
      return;
    }

    let json: unknown;
    try {
      json = JSON.parse(rawMessage);
    } catch {
      this.sendProtocolError(webSocket, "INVALID_MESSAGE", "Message must be valid JSON");
      return;
    }

    const parsed = realtimeClientEventSchema.safeParse(json);
    if (!parsed.success) {
      this.sendProtocolError(webSocket, "INVALID_MESSAGE", "Message does not match the protocol");
      return;
    }

    const now = new Date();
    if (!this.consumeMessageAllowance(webSocket, attachment, now.getTime())) return;

    if (parsed.data.type === "connection.ping") {
      attachment.lastSeenAt = now.toISOString();
      webSocket.serializeAttachment(attachment);
      sendEvent(webSocket, {
        ...createEventEnvelope(now),
        type: "connection.pong",
        nonce: parsed.data.nonce,
      });
      return;
    }

    if (parsed.data.type === "presence.heartbeat") {
      if (attachment.channel !== "presence") {
        this.sendProtocolError(webSocket, "INVALID_MESSAGE", "Heartbeat is not valid here");
        return;
      }
      attachment.lastSeenAt = now.toISOString();
      webSocket.serializeAttachment(attachment);
      this.broadcastPresenceSync(now);
      await this.ensurePresenceAlarm(now.getTime());
      return;
    }

    if (parsed.data.type === "demo.message" || parsed.data.type === "demo.broadcast") {
      if (attachment.channel !== "demo") {
        this.sendProtocolError(webSocket, "INVALID_MESSAGE", "Demo messages are not valid here");
        return;
      }
      const id = crypto.randomUUID();
      const fromServer = parsed.data.type === "demo.broadcast";
      const body =
        parsed.data.type === "demo.broadcast"
          ? `Server broadcast to ${this.activeSockets().length} connected client(s)`
          : parsed.data.body;
      this.broadcast({
        eventId: id,
        timestamp: now.toISOString(),
        type: "demo.message",
        id,
        body,
        sender: {
          kind: fromServer ? "server" : "client",
          connectionId: fromServer ? null : attachment.connectionId,
          name: fromServer ? "Server" : attachment.user.name,
        },
      });
      return;
    }

    if (parsed.data.type === "chat.send") {
      if (attachment.channel !== "chat" || !attachment.roomId) {
        this.sendProtocolError(webSocket, "INVALID_MESSAGE", "Chat messages are not valid here");
        return;
      }

      try {
        const message = await createRealtimeRepository().createChatMessage({
          id: crypto.randomUUID(),
          ownerId: attachment.user.id,
          roomId: attachment.roomId,
          senderId: attachment.user.id,
          senderName: attachment.user.name,
          content: parsed.data.body,
        });
        this.broadcast({
          eventId: message.id,
          timestamp: message.createdAt,
          type: "chat.message",
          payload: message,
        });
      } catch (error) {
        console.error(
          JSON.stringify({
            message: "realtime chat persistence failed",
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        );
        this.sendProtocolError(webSocket, "SERVER_ERROR", "Message could not be persisted");
      }
    }
  }

  async webSocketClose(
    webSocket: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    await this.leave(webSocket, "closed");
  }

  async webSocketError(webSocket: WebSocket, error: unknown): Promise<void> {
    console.error(
      JSON.stringify({
        message: "realtime websocket error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    );
    await this.leave(webSocket, "error");
  }

  async alarm(): Promise<void> {
    const now = new Date();
    for (const webSocket of this.ctx.getWebSockets("presence")) {
      const attachment = parseAttachment(webSocket);
      if (attachment?.active && isPresenceStale(attachment.lastSeenAt, now.getTime())) {
        await this.leave(webSocket, "timeout", now);
        webSocket.close(4000, "Presence heartbeat timed out");
      }
    }

    if (this.presenceSessions().length > 0) {
      await this.ctx.storage.setAlarm(now.getTime() + REALTIME_PRESENCE_ALARM_MS);
    }
  }

  publishNotification(event: RealtimeServerEvent): number {
    const parsed = realtimeServerEventSchema.safeParse(event);
    if (!parsed.success || !isNotificationEvent(parsed.data)) {
      throw new Error("Only validated notification events may be published to a user hub");
    }
    return this.broadcast(parsed.data);
  }

  private activeSockets(): WebSocket[] {
    return this.ctx
      .getWebSockets()
      .filter((webSocket) => parseAttachment(webSocket)?.active === true);
  }

  private broadcast(event: RealtimeServerEvent): number {
    const serialized = JSON.stringify(realtimeServerEventSchema.parse(event));
    let delivered = 0;
    for (const webSocket of this.activeSockets()) {
      if (webSocket.readyState !== WebSocket.OPEN) continue;
      try {
        webSocket.send(serialized);
        delivered += 1;
      } catch (error) {
        console.error(
          JSON.stringify({
            message: "realtime broadcast failed",
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        );
      }
    }
    return delivered;
  }

  private consumeMessageAllowance(
    webSocket: WebSocket,
    attachment: ConnectionAttachment,
    now: number,
  ): boolean {
    const result = consumeRealtimeRateLimit(
      {
        count: attachment.rateLimitCount,
        windowStartedAt: attachment.rateLimitWindowStartedAt,
      },
      now,
    );
    attachment.rateLimitCount = result.state.count;
    attachment.rateLimitWindowStartedAt = result.state.windowStartedAt;
    attachment.lastSeenAt = new Date(now).toISOString();
    webSocket.serializeAttachment(attachment);

    if (!result.allowed) {
      this.sendProtocolError(
        webSocket,
        "RATE_LIMITED",
        "Send at most 10 messages every 10 seconds",
      );
    }
    return result.allowed;
  }

  private sendProtocolError(
    webSocket: WebSocket,
    code: Extract<RealtimeServerEvent, { type: "protocol.error" }>["code"],
    message: string,
  ): void {
    sendEvent(webSocket, {
      ...createEventEnvelope(),
      type: "protocol.error",
      code,
      message,
    });
  }

  private toPresenceSession(attachment: ConnectionAttachment): RealtimePresenceSession {
    return {
      connectionId: attachment.connectionId,
      user: attachment.user,
      connectedAt: attachment.connectedAt,
      lastSeenAt: attachment.lastSeenAt,
    };
  }

  private presenceSessions(): RealtimePresenceSession[] {
    return this.ctx
      .getWebSockets("presence")
      .map(parseAttachment)
      .filter((attachment): attachment is ConnectionAttachment => Boolean(attachment?.active))
      .map((attachment) => this.toPresenceSession(attachment))
      .sort((left, right) => left.connectedAt.localeCompare(right.connectedAt));
  }

  private broadcastPresenceSync(now = new Date()): void {
    this.broadcast({
      ...createEventEnvelope(now),
      type: "presence.sync",
      payload: { sessions: this.presenceSessions() },
    });
  }

  private async leave(
    webSocket: WebSocket,
    reason: PresenceLeaveReason,
    now = new Date(),
  ): Promise<void> {
    const attachment = parseAttachment(webSocket);
    if (!attachment?.active) return;

    attachment.active = false;
    attachment.lastSeenAt = now.toISOString();
    webSocket.serializeAttachment(attachment);

    if (attachment.channel === "demo") {
      this.broadcast({
        ...createEventEnvelope(now),
        type: "connection.left",
        connectionId: attachment.connectionId,
        user: attachment.user,
      });
    }

    if (attachment.channel === "presence") {
      const session = this.toPresenceSession(attachment);
      this.broadcast({
        ...createEventEnvelope(now),
        type: "presence.leave",
        payload: session,
        reason,
      });
      this.broadcastPresenceSync(now);
    }

    if (attachment.channel === "chat") {
      this.broadcast({
        ...createEventEnvelope(now),
        type: "chat.presence",
        online: this.activeSockets().length,
      });
    }
  }

  private async ensurePresenceAlarm(now: number): Promise<void> {
    const alarm = await this.ctx.storage.getAlarm();
    if (alarm === null) {
      await this.ctx.storage.setAlarm(now + REALTIME_PRESENCE_ALARM_MS);
    }
  }
}
