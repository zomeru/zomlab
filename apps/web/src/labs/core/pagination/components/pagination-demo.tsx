"use client";

import { useNavigate } from "@tanstack/react-router";
import { Alert } from "@zomlab/ui/components/alert";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { NoteForm } from "~/labs/core/crud/components/note-form";
import { NotesList } from "~/labs/core/crud/components/notes-list";
import { useNotes } from "~/labs/core/crud/hooks/use-notes";
import { NotePagination } from "./note-pagination";

interface PaginationDemoProps {
  page: number;
  pageSize: number;
}

export function PaginationDemo({ page, pageSize }: PaginationDemoProps) {
  const navigate = useNavigate({ from: "/core/pagination-demo" });
  const { data, error, isFetching, isLoading } = useNotes({ page, pageSize });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader>
        <PageTitle>Pagination</PageTitle>
        <PageDescription>Browse your private notes one predictable page at a time.</PageDescription>
      </PageHeader>

      <div className="mt-8">
        <NoteForm />
      </div>

      <section className="mt-10 space-y-4" aria-labelledby="paginated-notes-heading">
        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-[var(--surface-shadow)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground" id="paginated-notes-heading">
              Paginated notes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" role="status">
              {data
                ? `Page ${data.page} of ${data.pageCount} · ${data.total} total`
                : "Loading pages…"}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            Notes per page
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onChange={(event) => {
                void navigate({
                  replace: true,
                  search: (previous) => ({
                    ...previous,
                    page: 1,
                    pageSize: Number(event.target.value),
                  }),
                });
              }}
              value={pageSize}
            >
              <option value={2}>2</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="space-y-3" role="status" aria-label="Loading paginated notes">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive" role="alert">
            Failed to load notes: {error.message}
          </Alert>
        ) : null}

        {!isLoading && !error && data?.items.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
            No notes yet. Create one above to start paging through your collection.
          </p>
        ) : null}

        {!isLoading && !error && data && data.items.length > 0 ? (
          <NotesList aria-label="Paginated notes" notes={data.items} />
        ) : null}

        <NotePagination
          basePath="/core/pagination-demo"
          page={data?.page ?? page}
          pageCount={data?.pageCount ?? 1}
          search={{ pageSize }}
        />

        <p className="sr-only" role="status">
          {isFetching && !isLoading ? "Loading the selected page." : ""}
        </p>
      </section>
    </div>
  );
}
