"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useNavigate } from "@tanstack/react-router";
import type { NoteListQuery } from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { useEffect, useState } from "react";
import { NoteForm } from "~/labs/core/crud/components/note-form";
import { useNotes } from "~/labs/core/crud/hooks/use-notes";
import { NotePagination } from "~/labs/core/pagination/components/note-pagination";
import { NoteSearch } from "~/labs/core/search-filter/components/note-search";
import { NotesTable } from "./notes-table";

type SortBy = NonNullable<NoteListQuery["sortBy"]>;
type SortDirection = NonNullable<NoteListQuery["sortDirection"]>;

interface TablesDemoProps {
  page: number;
  pageSize: number;
  query: string;
  sortBy: SortBy;
  sortDirection: SortDirection;
}

export function TablesDemo({ page, pageSize, query, sortBy, sortDirection }: TablesDemoProps) {
  const navigate = useNavigate({ from: "/core/tables-demo" });
  const [queryDraft, setQueryDraft] = useState(query);
  const [debouncedQuery] = useDebouncedValue(queryDraft, { wait: 300 });
  const { data, error, isFetching, isLoading } = useNotes({
    page,
    pageSize,
    query: debouncedQuery || undefined,
    sortBy,
    sortDirection,
  });

  useEffect(() => {
    setQueryDraft(query);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery !== query) {
      void navigate({
        replace: true,
        search: (previous) => ({
          ...previous,
          page: 1,
          query: debouncedQuery || undefined,
        }),
      });
    }
  }, [debouncedQuery, navigate, query]);

  function updateSort(nextSortBy: SortBy, nextDirection: SortDirection) {
    void navigate({
      replace: true,
      search: (previous) => ({
        ...previous,
        page: 1,
        sortBy: nextSortBy,
        sortDirection: nextDirection,
      }),
    });
  }

  const tableSearch = { page, pageSize, query: query || undefined, sortBy, sortDirection };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader>
        <PageTitle>Tables</PageTitle>
        <PageDescription>Scan, search, sort, and open your private notes.</PageDescription>
      </PageHeader>

      <div className="mt-8">
        <NoteForm />
      </div>

      <section className="mt-10 space-y-4" aria-labelledby="notes-table-heading">
        <h2 className="sr-only" id="notes-table-heading">
          Notes table
        </h2>
        <NoteSearch onQueryChange={setQueryDraft} query={queryDraft} />

        {isLoading ? (
          <div className="space-y-3" role="status" aria-label="Loading notes table">
            <Skeleton className="h-12" />
            <Skeleton className="h-40" />
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive" role="alert">
            Failed to load notes: {error.message}
          </Alert>
        ) : null}

        {!isLoading && !error && data?.items.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
            {debouncedQuery
              ? `No notes match “${debouncedQuery}”. Clear the search to see every note.`
              : "No notes yet. Create one above to populate the table."}
          </p>
        ) : null}

        {!isLoading && !error && data && data.items.length > 0 ? (
          <NotesTable
            notes={data.items}
            onSortChange={updateSort}
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
    </div>
  );
}
