import { createFileRoute } from "@tanstack/react-router";
import { NotesView } from "../labs/core/crud/components/notes-view";

export const Route = createFileRoute("/_authenticated/core/crud/demo/")({
  component: NotesView,
});
