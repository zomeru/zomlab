"use client";

import type { RealtimeServerEvent } from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { Radio, Send } from "lucide-react";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { formatTime } from "~/labs/core/shared/formatters";
import { ConnectionPanel } from "~/labs/realtime/shared/connection-panel";
import { EventLog } from "~/labs/realtime/shared/event-log";
import { RealtimeDemoShell } from "~/labs/realtime/shared/realtime-demo-shell";
import { useRealtimeConnection } from "~/labs/realtime/shared/use-realtime-connection";

type DemoMessage = Extract<RealtimeServerEvent, { type: "demo.message" }>;

export function WebSocketsDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("Hello from ZomLab");
  const [bodyError, setBodyError] = useState("");
  const [messages, setMessages] = useState<DemoMessage[]>([]);

  const handleEvent = useCallback((event: RealtimeServerEvent) => {
    if (event.type !== "demo.message") return;
    setMessages((current) => {
      if (current.some((message) => message.id === event.id)) return current;
      return [...current, event].slice(-100);
    });
  }, []);
  const connection = useRealtimeConnection({ channel: "demo", onEvent: handleEvent });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = body.trim();
    if (!value) {
      setBodyError("Enter a message.");
      inputRef.current?.focus();
      return;
    }
    if (connection.send({ type: "demo.message", body: value })) {
      setBody("");
      setBodyError("");
    }
  }

  return (
    <RealtimeDemoShell
      title="WebSockets"
      description="A persistent bidirectional connection backed by a hibernating Cloudflare Durable Object, with structured messages, server broadcasts, heartbeats, and bounded reconnects."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <ConnectionPanel connection={connection} />
        <Card>
          <CardHeader>
            <CardTitle>Send a structured message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <Field>
                <FieldLabel htmlFor="websocket-message">Message</FieldLabel>
                <Input
                  ref={inputRef}
                  id="websocket-message"
                  value={body}
                  maxLength={500}
                  aria-describedby="websocket-message-error"
                  aria-invalid={bodyError ? true : undefined}
                  onChange={(event) => setBody(event.target.value)}
                />
                <div id="websocket-message-error">
                  {bodyError ? <FieldError>{bodyError}</FieldError> : null}
                </div>
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button disabled={connection.status !== "connected"} type="submit">
                  <Send aria-hidden="true" />
                  Send
                </Button>
                <Button
                  disabled={connection.status !== "connected"}
                  onClick={() => connection.send({ type: "demo.broadcast" })}
                  type="button"
                  variant="outline"
                >
                  <Radio aria-hidden="true" />
                  Request server broadcast
                </Button>
              </div>
            </form>
            {connection.error ? (
              <Alert variant="destructive" role="alert">
                {connection.error}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>Messages</CardTitle>
            <Badge variant="outline">{messages.length} shown</Badge>
          </CardHeader>
          <CardContent>
            {messages.length > 0 ? (
              <ol className="max-h-96 space-y-3 overflow-y-auto" aria-label="WebSocket messages">
                {messages.map((message) => {
                  const isYou = message.sender.connectionId === connection.connectionId;
                  return (
                    <li
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm"
                      key={message.id}
                    >
                      <time
                        className="font-mono text-xs text-muted-foreground"
                        dateTime={message.timestamp}
                      >
                        {formatTime(message.timestamp)}
                      </time>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {message.sender.kind === "server"
                            ? "Server"
                            : isYou
                              ? "You"
                              : message.sender.name}
                        </p>
                        <p className="break-words text-muted-foreground">{message.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                Send a message or open this page in another tab to test broadcasts.
              </p>
            )}
          </CardContent>
        </Card>
        <EventLog entries={connection.log} onClear={connection.clearLog} />
      </div>
    </RealtimeDemoShell>
  );
}
