"use client";

import {
  REALTIME_CHAT_MESSAGE_MAX_LENGTH,
  type RealtimeChatMessage,
  type RealtimeServerEvent,
} from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldLabel } from "@zomlab/ui/components/field";
import { Textarea } from "@zomlab/ui/components/textarea";
import { ArrowDown, Send } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatTime } from "~/labs/core/shared/formatters";
import { mergeChatMessages } from "~/labs/realtime/shared/client-utils";
import { ConnectionPanel } from "~/labs/realtime/shared/connection-panel";
import { EventLog } from "~/labs/realtime/shared/event-log";
import { RealtimeDemoShell } from "~/labs/realtime/shared/realtime-demo-shell";
import { useRealtimeConnection } from "~/labs/realtime/shared/use-realtime-connection";
import { useRealtimeChatHistory } from "~/labs/realtime/shared/use-realtime-data";

const ROOM_ID = "general";

export function LiveChatDemo() {
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState("");
  const [liveMessages, setLiveMessages] = useState<RealtimeChatMessage[]>([]);
  const [online, setOnline] = useState(0);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const history = useRealtimeChatHistory(ROOM_ID);

  const handleEvent = useCallback(
    (event: RealtimeServerEvent) => {
      if (event.type === "chat.message") {
        setLiveMessages((current) => mergeChatMessages(current, [event.payload]).slice(-100));
      } else if (event.type === "chat.presence") {
        setOnline(event.online);
      } else if (event.type === "connection.ready") {
        void history.refetch();
      }
    },
    [history.refetch],
  );
  const connection = useRealtimeConnection({
    channel: "chat",
    roomId: ROOM_ID,
    onEvent: handleEvent,
  });

  const messages = useMemo(
    () => mergeChatMessages(history.data?.items ?? [], liveMessages),
    [history.data?.items, liveMessages],
  );
  const latestMessageId = messages.at(-1)?.id;

  useEffect(() => {
    if (!latestMessageId) return;
    const list = messageListRef.current;
    if (!list) return;
    if (stickToBottomRef.current) {
      list.scrollTop = list.scrollHeight;
      setShowJumpToLatest(false);
    } else {
      setShowJumpToLatest(true);
    }
  }, [latestMessageId]);

  function sendMessage() {
    const body = content.trim();
    if (!body) {
      setContentError("Enter a message.");
      textareaRef.current?.focus();
      return;
    }
    if (connection.send({ type: "chat.send", body })) {
      setContent("");
      setContentError("");
      stickToBottomRef.current = true;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      sendMessage();
    }
  }

  function jumpToLatest() {
    const list = messageListRef.current;
    if (!list) return;
    stickToBottomRef.current = true;
    list.scrollTop = list.scrollHeight;
    setShowJumpToLatest(false);
  }

  return (
    <RealtimeDemoShell
      title="Live Chat"
      description="An authenticated, user-scoped chat lab with PostgreSQL history, server-side validation, room broadcasts across your tabs, reconnect recovery, and deduplication."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Room: {ROOM_ID}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Open this route in another tab while signed in to test synchronized chat safely.
              </p>
            </div>
            <Badge variant="success">
              <span aria-hidden="true">●</span>
              {online} online
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.error ? (
              <Alert variant="destructive" role="alert">
                {history.error.message}
              </Alert>
            ) : null}
            <div
              ref={messageListRef}
              className="h-[28rem] overflow-y-auto rounded-lg border border-border bg-background p-4"
              onScroll={(event) => {
                const target = event.currentTarget;
                const nearBottom =
                  target.scrollHeight - target.scrollTop - target.clientHeight < 56;
                stickToBottomRef.current = nearBottom;
                if (nearBottom) setShowJumpToLatest(false);
              }}
            >
              {history.isLoading && messages.length === 0 ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Loading recent messages…
                </p>
              ) : null}
              {messages.length > 0 ? (
                <ol className="space-y-5" aria-label="Chat messages">
                  {messages.map((message) => {
                    const isYou = message.senderId === connection.user?.id;
                    return (
                      <li key={message.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-medium">{isYou ? "You" : message.senderName}</p>
                          <time
                            className="font-mono text-xs text-muted-foreground"
                            dateTime={message.createdAt}
                          >
                            {formatTime(message.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {message.content}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              ) : history.isLoading ? null : (
                <p className="text-sm text-muted-foreground">No messages yet. Start the room.</p>
              )}
            </div>
            {showJumpToLatest ? (
              <Button onClick={jumpToLatest} size="sm" type="button" variant="outline">
                <ArrowDown aria-hidden="true" />
                Jump to latest
              </Button>
            ) : null}
            <div className="sr-only" role="status">
              {messages.at(-1) ? `New message from ${messages.at(-1)?.senderName}` : ""}
            </div>
            <form className="space-y-3" onSubmit={handleSubmit} noValidate>
              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="chat-message">Message</FieldLabel>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {content.length}/{REALTIME_CHAT_MESSAGE_MAX_LENGTH}
                  </span>
                </div>
                <Textarea
                  ref={textareaRef}
                  id="chat-message"
                  value={content}
                  maxLength={REALTIME_CHAT_MESSAGE_MAX_LENGTH}
                  rows={3}
                  aria-describedby="chat-message-hint chat-message-error"
                  aria-invalid={contentError ? true : undefined}
                  onChange={(event) => setContent(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                />
                <p className="text-xs text-muted-foreground" id="chat-message-hint">
                  Press Ctrl+Enter or Command+Enter to send.
                </p>
                <div id="chat-message-error">
                  {contentError ? <FieldError>{contentError}</FieldError> : null}
                </div>
              </Field>
              <Button disabled={connection.status !== "connected"} type="submit">
                <Send aria-hidden="true" />
                Send message
              </Button>
            </form>
            {connection.error ? (
              <Alert variant="destructive" role="alert">
                {connection.error}
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ConnectionPanel connection={connection} />
          <EventLog entries={connection.log} onClear={connection.clearLog} />
        </div>
      </div>
    </RealtimeDemoShell>
  );
}
