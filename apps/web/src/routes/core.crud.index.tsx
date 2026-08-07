import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/core/crud/")({
  beforeLoad: () => {
    throw redirect({ to: "/core/crud/demo" });
  },
});
