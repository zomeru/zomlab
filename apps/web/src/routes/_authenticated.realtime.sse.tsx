import { createFileRoute } from "@tanstack/react-router";
import { SseDemo } from "~/labs/realtime/sse/sse-demo";

export const Route = createFileRoute("/_authenticated/realtime/sse")({
  component: SseDemo,
});
