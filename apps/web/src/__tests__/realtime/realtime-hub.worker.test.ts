import { env, evictDurableObject } from "cloudflare:test";
import {
  REALTIME_MAX_PAYLOAD_BYTES,
  type RealtimeServerEvent,
  realtimeServerEventSchema,
} from "@zomlab/contracts";
import { afterEach, describe, expect, test } from "vitest";

const sockets: WebSocket[] = [];

function nextEvent(
  socket: WebSocket,
  matches: (event: RealtimeServerEvent) => boolean,
): Promise<RealtimeServerEvent> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", onMessage);
      reject(new Error("Timed out waiting for realtime event"));
    }, 2_000);

    function onMessage(message: MessageEvent) {
      if (typeof message.data !== "string") return;
      const parsed = realtimeServerEventSchema.safeParse(JSON.parse(message.data));
      if (!parsed.success || !matches(parsed.data)) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      resolve(parsed.data);
    }

    socket.addEventListener("message", onMessage);
  });
}

async function connectDemo(
  hubName: string,
  userId: string,
): Promise<{
  socket: WebSocket;
  stub: Cloudflare.Env["REALTIME_HUB"] extends DurableObjectNamespace<infer T>
    ? DurableObjectStub<T>
    : never;
}> {
  const stub = env.REALTIME_HUB.getByName(hubName);
  const response = await stub.fetch("https://realtime.internal/connect", {
    headers: {
      Upgrade: "websocket",
      "x-zomlab-realtime-channel": "demo",
      "x-zomlab-realtime-user-id": userId,
      "x-zomlab-realtime-user-name": encodeURIComponent(`User ${userId}`),
    },
  });
  const socket = response.webSocket;
  if (!socket) throw new Error("Expected WebSocket upgrade response");
  sockets.push(socket);
  socket.accept();
  await nextEvent(socket, (event) => event.type === "connection.ready");
  return { socket, stub };
}

afterEach(() => {
  for (const socket of sockets.splice(0)) {
    if (socket.readyState < WebSocket.CLOSING) socket.close(1000, "Test complete");
  }
});

describe("RealtimeHub", () => {
  test("broadcasts one validated client message to every socket in the channel", async () => {
    const first = await connectDemo("worker-broadcast", "one");
    const second = await connectDemo("worker-broadcast", "two");
    const firstMessage = nextEvent(first.socket, (event) => event.type === "demo.message");
    const secondMessage = nextEvent(second.socket, (event) => event.type === "demo.message");

    first.socket.send(JSON.stringify({ type: "demo.message", body: "hello" }));

    const [receivedByFirst, receivedBySecond] = await Promise.all([firstMessage, secondMessage]);
    expect(receivedByFirst).toMatchObject({ type: "demo.message", body: "hello" });
    expect(receivedBySecond).toMatchObject({
      type: "demo.message",
      eventId: receivedByFirst.eventId,
    });
  });

  test("restores attachment state after hibernation and answers application pings", async () => {
    const { socket, stub } = await connectDemo("worker-hibernation", "one");
    await evictDurableObject(stub);
    const nonce = crypto.randomUUID();
    const pong = nextEvent(
      socket,
      (event) => event.type === "connection.pong" && event.nonce === nonce,
    );

    socket.send(JSON.stringify({ type: "connection.ping", nonce }));

    await expect(pong).resolves.toMatchObject({ type: "connection.pong", nonce });
  });

  test("rejects malformed and oversized payloads without executing arbitrary events", async () => {
    const { socket } = await connectDemo("worker-validation", "one");
    const invalid = nextEvent(socket, (event) => event.type === "protocol.error");
    socket.send(JSON.stringify({ type: "admin.execute" }));
    await expect(invalid).resolves.toMatchObject({
      type: "protocol.error",
      code: "INVALID_MESSAGE",
    });

    const closed = new Promise<CloseEvent>((resolve) => {
      socket.addEventListener("close", resolve, { once: true });
    });
    socket.send("x".repeat(REALTIME_MAX_PAYLOAD_BYTES + 1));
    await expect(closed).resolves.toMatchObject({ code: 1009 });
  });

  test("rate limits every inbound operation, including application pings", async () => {
    const { socket } = await connectDemo("worker-rate-limit", "one");
    const rateLimited = nextEvent(
      socket,
      (event) => event.type === "protocol.error" && event.code === "RATE_LIMITED",
    );

    for (let index = 0; index < 11; index += 1) {
      socket.send(JSON.stringify({ type: "connection.ping", nonce: crypto.randomUUID() }));
    }

    await expect(rateLimited).resolves.toMatchObject({
      type: "protocol.error",
      code: "RATE_LIMITED",
    });
  });
});
