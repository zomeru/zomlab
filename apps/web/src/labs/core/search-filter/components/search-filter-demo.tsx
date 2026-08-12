"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { Alert } from "@zomlab/ui/components/alert";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { useEffect, useState } from "react";
import { NoteForm } from "~/labs/core/crud/components/note-form";
import { NotesList } from "~/labs/core/crud/components/notes-list";
import { useNotes } from "~/labs/core/crud/hooks/use-notes";
import { NoteSearch } from "./note-search";
import { SearchEmptyState } from "./search-empty-state";

interface SearchFilterDemoProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function SearchFilterDemo({ query, onQueryChange }: SearchFilterDemoProps) {
  const [queryDraft, setQueryDraft] = useState(query);
  const [debouncedQuery] = useDebouncedValue(queryDraft, { wait: 300 });
  const { data, isLoading, error } = useNotes({
    query: debouncedQuery || undefined,
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    setQueryDraft(query);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery !== query) {
      onQueryChange(debouncedQuery);
    }
  }, [debouncedQuery, onQueryChange, query]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader>
        <PageTitle>Search and Filtering</PageTitle>
        <PageDescription>Search your private notes by title or content.</PageDescription>
      </PageHeader>

      <div className="mt-8">
        <NoteForm />
      </div>

      <div className="mt-10 space-y-4">
        <NoteSearch query={queryDraft} onQueryChange={setQueryDraft} />

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

        {!isLoading && !error && data && (
          <p className="sr-only" role="status">
            {data.total} {data.total === 1 ? "note" : "notes"}
            {debouncedQuery ? ` match “${debouncedQuery}”` : ""}.
          </p>
        )}

        {!isLoading && !error && data && data.items.length === 0 && debouncedQuery && (
          <SearchEmptyState query={debouncedQuery} />
        )}

        {!isLoading && !error && data && data.items.length === 0 && !debouncedQuery && (
          <SearchEmptyState />
        )}

        {!isLoading && !error && data && data.items.length > 0 && <NotesList notes={data.items} />}
      </div>
    </div>
  );
}
