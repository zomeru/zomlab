import { createFileRoute } from "@tanstack/react-router";
import { NoteDetail } from "~/labs/core/crud/components/note-detail";

export const Route = createFileRoute("/_authenticated/core/crud-demo/$id")({
  component: NoteDetailRoute,
});

function NoteDetailRoute() {
  const { id } = Route.useParams();
  return <NoteDetail id={id} />;
}
