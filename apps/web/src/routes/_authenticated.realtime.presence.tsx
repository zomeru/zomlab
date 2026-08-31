import { createFileRoute } from "@tanstack/react-router";
import { PresenceDemo } from "~/labs/realtime/presence/presence-demo";

export const Route = createFileRoute("/_authenticated/realtime/presence")({
  component: PresenceDemo,
});
