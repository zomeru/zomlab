import { createFileRoute } from "@tanstack/react-router";
import { NotificationsDemo } from "~/labs/realtime/notifications/notifications-demo";

export const Route = createFileRoute("/_authenticated/realtime/notifications")({
  component: NotificationsDemo,
});
