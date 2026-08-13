"use client";

import { Alert } from "@zomlab/ui/components/alert";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { CoreLoadingState } from "~/labs/core/shared/core-loading-state";
import { useNotes } from "../hooks/use-notes";
import { NoteForm } from "./note-form";
import { NotesList } from "./notes-list";

export function NotesView() {
  const { data, isLoading, error } = useNotes();

  return (
    <CoreDemoShell description="Your personal notes — private to you." title="Notes">
      <NoteForm />

      <div className="mt-10 space-y-4">
        {isLoading && (
          <CoreLoadingState className="space-y-3" label="Loading notes">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </CoreLoadingState>
        )}

        {error && (
          <Alert variant="destructive" role="alert">
            Failed to load notes: {error.message}
          </Alert>
        )}

        {!isLoading && !error && data && data.items.length === 0 && (
          <EmptyState>
            <EmptyStateTitle>No notes yet</EmptyStateTitle>
            <EmptyStateDescription>
              Create your first note above to begin your private workspace.
            </EmptyStateDescription>
          </EmptyState>
        )}

        {!isLoading && !error && data && data.items.length > 0 && <NotesList notes={data.items} />}
      </div>
    </CoreDemoShell>
  );
}
