import { createFileRoute, redirect } from "@tanstack/react-router";
import { NoteDetail } from "../labs/core/crud/components/note-detail";

export const Route = createFileRoute("/_authenticated/core/crud/demo/$id")({
  beforeLoad: async () => {
    const response = await fetch("/api/auth/get-session", {
      credentials: "include",
    });

    if (!response.ok) {
      throw redirect({ to: "/login" });
    }
  },
  component: NoteDetailRoute,
});

function NoteDetailRoute() {
  const { id } = Route.useParams();
  return <NoteDetail id={id} />;
}
