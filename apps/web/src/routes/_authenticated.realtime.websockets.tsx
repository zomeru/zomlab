import { createFileRoute } from "@tanstack/react-router";
import { WebSocketsDemo } from "~/labs/realtime/websockets/websockets-demo";

export const Route = createFileRoute("/_authenticated/realtime/websockets")({
  component: WebSocketsDemo,
});
