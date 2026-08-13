"use client";

import type { NoteListQuery } from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { NoteForm } from "~/labs/core/crud/components/note-form";
import { useNotes } from "~/labs/core/crud/hooks/use-notes";
import { NotePagination } from "~/labs/core/pagination/components/note-pagination";
import { NoteSearch } from "~/labs/core/search-filter/components/note-search";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { CoreLoadingState } from "~/labs/core/shared/core-loading-state";
import { useDebouncedQuery } from "~/labs/core/shared/use-debounced-query";
import { NotesTable } from "./notes-table";

type SortBy = NonNullable<NoteListQuery["sortBy"]>;
type SortDirection = NonNullable<NoteListQuery["sortDirection"]>;

interface TablesDemoProps {
  onQueryChange: (query: string) => void;
  onSortChange: (sortBy: SortBy, sortDirection: SortDirection) => void;
  page: number;
  pageSize: number;
  query: string;
  sortBy: SortBy;
  sortDirection: SortDirection;
}

export function TablesDemo({
  onQueryChange,
  onSortChange,
  page,
  pageSize,
  query,
  sortBy,
  sortDirection,
}: TablesDemoProps) {
  const { queryDraft, setQueryDraft } = useDebouncedQuery({ onQueryChange, query });
  const { data, error, isFetching, isLoading } = useNotes({
    page,
    pageSize,
    query: query || undefined,
    sortBy,
    sortDirection,
  });

  const tableSearch = { page, pageSize, query: query || undefined, sortBy, sortDirection };

  return (
    <CoreDemoShell
      description="Scan, search, sort, and open your private notes."
      title="Tables"
      width="table"
    >
      <NoteForm />

      <section className="mt-10 space-y-4" aria-labelledby="notes-table-heading">
        <h2 className="sr-only" id="notes-table-heading">
          Notes table
        </h2>
        <NoteSearch onQueryChange={setQueryDraft} query={queryDraft} />

        {isLoading ? (
          <CoreLoadingState className="space-y-3" label="Loading notes table">
            <Skeleton className="h-12" />
            <Skeleton className="h-40" />
          </CoreLoadingState>
        ) : null}

        {error ? (
          <Alert variant="destructive" role="alert">
            Failed to load notes: {error.message}
          </Alert>
        ) : null}

        {!isLoading && !error && data?.items.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>
              {query ? `No notes match “${query}”` : "No notes yet"}
            </EmptyStateTitle>
            <EmptyStateDescription>
              {query
                ? "Clear the search to see every note."
                : "Create one above to populate the table."}
            </EmptyStateDescription>
          </EmptyState>
        ) : null}

        {!isLoading && !error && data && data.items.length > 0 ? (
          <NotesTable
            notes={data.items}
            onSortChange={onSortChange}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortDirection={sortDirection}
            total={data.total}
          />
        ) : null}

        <div className="space-y-2">
          <p className="text-center text-sm tabular-nums text-muted-foreground">
            Page {data?.page ?? page} of {data?.pageCount ?? 1}
          </p>
          <NotePagination
            basePath="/core/tables-demo"
            page={data?.page ?? page}
            pageCount={data?.pageCount ?? 1}
            search={tableSearch}
          />
        </div>

        <p className="sr-only" role="status">
          {isFetching && !isLoading ? "Updating the notes table." : ""}
        </p>
      </section>
    </CoreDemoShell>
  );
}
