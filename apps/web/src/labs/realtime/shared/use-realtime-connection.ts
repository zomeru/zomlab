"use client";

import {
  REALTIME_EVENT_LOG_LIMIT,
  REALTIME_MAX_PAYLOAD_BYTES,
  type RealtimeChannel,
  type RealtimeClientEvent,
  type RealtimeServerEvent,
  type RealtimeUser,
  realtimeServerEventSchema,
} from "@zomlab/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { getReconnectDelay } from "./client-utils";

const MAX_RECONNECT_ATTEMPTS = 8;
const HEARTBEAT_INTERVAL_MS = 15_000;
const STALE_CONNECTION_MS = 35_000;

export type RealtimeConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "failed";

export interface RealtimeLogEntry {
  id: string;
  timestamp: string;
  type: string;
  direction: "in" | "out" | "local";
  detail?: string;
}

interface ConnectionInfo {
  connectionId?: string;
  connectedAt?: string;
  user?: RealtimeUser;
}

interface UseRealtimeConnectionOptions {
  channel: RealtimeChannel;
  onEvent?: (event: RealtimeServerEvent) => void;
  roomId?: string;
}

function websocketUrl(channel: RealtimeChannel, roomId?: string): string {
  const url = new URL("/api/realtime/ws", window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("channel", channel);
  if (roomId) url.searchParams.set("roomId", roomId);
  return url.toString();
}

export function useRealtimeConnection({ channel, onEvent, roomId }: UseRealtimeConnectionOptions) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("connecting");
  const [connection, setConnection] = useState<ConnectionInfo>({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [messagesSent, setMessagesSent] = useState(0);
  const [latency, setLatency] = useState<number | undefined>(undefined);
  const [lastEvent, setLastEvent] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [log, setLog] = useState<RealtimeLogEntry[]>([]);

  const socketRef = useRef<WebSocket | undefined>(undefined);
  const mountedRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const lastPongAtRef = useRef(Date.now());
  const pingTimesRef = useRef(new Map<string, number>());
  const onEventRef = useRef(onEvent);
  const connectionScope = `${channel}:${roomId ?? ""}`;
  onEventRef.current = onEvent;

  const addLog = useCallback(
    (type: string, direction: RealtimeLogEntry["direction"], detail?: string) => {
      setLog((current) =>
        [
          ...current,
          { id: crypto.randomUUID(), timestamp: new Date().toISOString(), type, direction, detail },
        ].slice(-REALTIME_EVENT_LOG_LIMIT),
      );
    },
    [],
  );

  const stopTimers = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    reconnectTimerRef.current = undefined;
    heartbeatTimerRef.current = undefined;
  }, []);

  const send = useCallback(
    (event: RealtimeClientEvent): boolean => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setError("Connect before sending a message.");
        return false;
      }

      const payload = JSON.stringify(event);
      if (new TextEncoder().encode(payload).byteLength > REALTIME_MAX_PAYLOAD_BYTES) {
        setError(`Messages must be under ${REALTIME_MAX_PAYLOAD_BYTES} bytes.`);
        return false;
      }
      socket.send(payload);
      setMessagesSent((count) => count + 1);
      addLog(event.type, "out");
      return true;
    },
    [addLog],
  );

  const openSocketRef = useRef<() => void>(() => undefined);

  openSocketRef.current = () => {
    if (!mountedRef.current) return;
    const existing = socketRef.current;
    if (existing?.readyState === WebSocket.OPEN || existing?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    setStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");
    setError(undefined);
    addLog(
      reconnectAttemptsRef.current > 0 ? "connection.reconnecting" : "connection.connecting",
      "local",
    );

    const socket = new WebSocket(websocketUrl(channel, roomId));
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      if (!mountedRef.current || socketRef.current !== socket) {
        socket.close(1000, "Superseded connection");
        return;
      }
      reconnectAttemptsRef.current = 0;
      setReconnectAttempts(0);
      setStatus("connected");
      setError(undefined);
      lastPongAtRef.current = Date.now();
      addLog("connection.open", "local");

      const heartbeat = () => {
        if (Date.now() - lastPongAtRef.current > STALE_CONNECTION_MS) {
          addLog("connection.stale", "local");
          socket.close(4001, "Heartbeat timed out");
          return;
        }
        const nonce = crypto.randomUUID();
        pingTimesRef.current.set(nonce, performance.now());
        send({ type: "connection.ping", nonce });
        if (channel === "presence") send({ type: "presence.heartbeat" });
      };
      heartbeat();
      heartbeatTimerRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    });

    socket.addEventListener("message", (message) => {
      if (socketRef.current !== socket || typeof message.data !== "string") return;
      let json: unknown;
      try {
        json = JSON.parse(message.data);
      } catch {
        setError("The server sent malformed JSON.");
        addLog("protocol.invalid-json", "in");
        return;
      }

      const parsed = realtimeServerEventSchema.safeParse(json);
      if (!parsed.success) {
        setError("The server sent an event outside the expected protocol.");
        addLog("protocol.invalid-event", "in");
        return;
      }

      const event = parsed.data;
      setMessagesReceived((count) => count + 1);
      setLastEvent(event.type);
      addLog(event.type, "in");

      if (event.type === "connection.ready") {
        setConnection({
          connectionId: event.connectionId,
          connectedAt: event.connectedAt,
          user: event.user,
        });
      } else if (event.type === "connection.pong") {
        const startedAt = pingTimesRef.current.get(event.nonce);
        if (startedAt !== undefined) {
          setLatency(Math.round(performance.now() - startedAt));
          pingTimesRef.current.delete(event.nonce);
        }
        lastPongAtRef.current = Date.now();
      } else if (event.type === "protocol.error") {
        setError(event.message);
      }

      onEventRef.current?.(event);
    });

    socket.addEventListener("error", () => {
      if (!mountedRef.current || intentionalDisconnectRef.current || socketRef.current !== socket) {
        return;
      }
      setError("The WebSocket connection encountered an error.");
      addLog("connection.error", "local");
    });

    socket.addEventListener("close", (event) => {
      if (socketRef.current !== socket) return;
      socketRef.current = undefined;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = undefined;
      pingTimesRef.current.clear();
      addLog("connection.close", "local", `${event.code} ${event.reason}`.trim());

      if (!mountedRef.current || intentionalDisconnectRef.current) {
        setStatus("disconnected");
        return;
      }

      const attempt = reconnectAttemptsRef.current + 1;
      reconnectAttemptsRef.current = attempt;
      setReconnectAttempts(attempt);
      if (attempt > MAX_RECONNECT_ATTEMPTS) {
        setStatus("failed");
        setError("Reconnect limit reached. Connect manually to try again.");
        return;
      }

      setStatus("reconnecting");
      const delay = getReconnectDelay(attempt);
      addLog("connection.reconnect-scheduled", "local", `${delay}ms`);
      reconnectTimerRef.current = setTimeout(() => openSocketRef.current(), delay);
    });
  };

  const connect = useCallback(() => {
    intentionalDisconnectRef.current = false;
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    openSocketRef.current();
  }, []);

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    stopTimers();
    const socket = socketRef.current;
    socketRef.current = undefined;
    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close(1000, "Intentional disconnect");
    }
    setStatus("disconnected");
    addLog("connection.disconnect", "local");
  }, [addLog, stopTimers]);

  useEffect(() => {
    if (!connectionScope) return;
    mountedRef.current = true;
    intentionalDisconnectRef.current = false;
    const initialConnectTimer = setTimeout(() => openSocketRef.current(), 0);
    return () => {
      clearTimeout(initialConnectTimer);
      mountedRef.current = false;
      intentionalDisconnectRef.current = true;
      stopTimers();
      const socket = socketRef.current;
      socketRef.current = undefined;
      if (socket && socket.readyState < WebSocket.CLOSING) {
        socket.close(1000, "Component unmounted");
      }
      pingTimesRef.current.clear();
    };
  }, [connectionScope, stopTimers]);

  return {
    ...connection,
    status,
    reconnectAttempts,
    messagesReceived,
    messagesSent,
    latency,
    lastEvent,
    error,
    log,
    connect,
    disconnect,
    send,
    clearLog: useCallback(() => setLog([]), []),
  };
}

export type RealtimeConnection = ReturnType<typeof useRealtimeConnection>;
