"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { NoteForm } from "~/labs/core/crud/components/note-form";
import { NotesList } from "~/labs/core/crud/components/notes-list";
import { useNotes } from "~/labs/core/crud/hooks/use-notes";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { CoreLoadingState } from "~/labs/core/shared/core-loading-state";
import { useDebouncedQuery } from "~/labs/core/shared/use-debounced-query";
import { NoteSearch } from "./note-search";
import { SearchEmptyState } from "./search-empty-state";

interface SearchFilterDemoProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function SearchFilterDemo({ query, onQueryChange }: SearchFilterDemoProps) {
  const { queryDraft, setQueryDraft } = useDebouncedQuery({ onQueryChange, query });
  const { data, isLoading, error } = useNotes({
    query: query || undefined,
    page: 1,
    pageSize: 20,
  });

  return (
    <CoreDemoShell
      description="Search your private notes by title or content."
      title="Search and Filtering"
    >
      <div className="mt-8">
        <NoteForm />
      </div>

      <div className="mt-10 space-y-4">
        <NoteSearch query={queryDraft} onQueryChange={setQueryDraft} />

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

        {!isLoading && !error && data && (
          <p className="sr-only" role="status">
            {data.total} {data.total === 1 ? "note" : "notes"}
            {query ? ` match “${query}”` : ""}.
          </p>
        )}

        {!isLoading && !error && data && data.items.length === 0 && query && (
          <SearchEmptyState query={query} />
        )}

        {!isLoading && !error && data && data.items.length === 0 && !query && <SearchEmptyState />}

        {!isLoading && !error && data && data.items.length > 0 && <NotesList notes={data.items} />}
      </div>
    </CoreDemoShell>
  );
}
