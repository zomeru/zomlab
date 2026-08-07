"use client";

import { useNotes } from "../hooks/use-notes";
import { EmptyState } from "./empty-states";
import { NoteForm } from "./note-form";
import { NotesList } from "./notes-list";

export function NotesView() {
  const { data, isLoading, error } = useNotes();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Notes</h1>
      <p className="mt-2 text-lg text-muted-foreground">Your personal notes — private to you.</p>

      <div className="mt-8">
        <NoteForm />
      </div>

      <div className="mt-10 space-y-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground" role="status">
            Loading notes…
          </p>
        )}

        {error && (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            Failed to load notes: {error.message}
          </p>
        )}

        {!isLoading && !error && data && data.length === 0 && <EmptyState />}

        {!isLoading && !error && data && data.length > 0 && <NotesList notes={data} />}
      </div>
    </div>
  );
}
