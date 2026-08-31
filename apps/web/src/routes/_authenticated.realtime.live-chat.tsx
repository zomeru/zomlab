import { createFileRoute } from "@tanstack/react-router";
import { LiveChatDemo } from "~/labs/realtime/live-chat/live-chat-demo";

export const Route = createFileRoute("/_authenticated/realtime/live-chat")({
  component: LiveChatDemo,
});
