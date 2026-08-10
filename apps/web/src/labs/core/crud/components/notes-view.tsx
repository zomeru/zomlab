"use client";

import { useNotes } from "../hooks/use-notes";
import { EmptyState } from "./empty-states";
import { NoteForm } from "./note-form";
import { NotesList } from "./notes-list";

export function NotesView() {
  const { data, isLoading, error } = useNotes();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader>
        <PageTitle>Notes</PageTitle>
        <PageDescription>Your personal notes — private to you.</PageDescription>
      </PageHeader>

      <div className="mt-8">
        <NoteForm />
      </div>

      <div className="mt-10 space-y-4">
        {isLoading && (
          <div className="space-y-3" role="status" aria-label="Loading notes">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" role="alert">
            Failed to load notes: {error.message}
          </Alert>
        )}

        {!isLoading && !error && data && data.length === 0 && <EmptyState />}

        {!isLoading && !error && data && data.length > 0 && <NotesList notes={data} />}
      </div>
    </div>
  );
}

import { Alert } from "@zomlab/ui/components/alert";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { Skeleton } from "@zomlab/ui/components/skeleton";
