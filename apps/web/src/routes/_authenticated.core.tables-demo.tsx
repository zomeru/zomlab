import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";
import { TablesDemo } from "~/labs/core/tables/components/tables-demo";

export const Route = createFileRoute("/_authenticated/core/tables-demo")({
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    pageSize: z.coerce.number().int().min(1).max(20).catch(5),
    query: z.string().trim().max(200).optional(),
    sortBy: z.enum(["title", "createdAt", "updatedAt"]).catch("updatedAt"),
    sortDirection: z.enum(["asc", "desc"]).catch("desc"),
  }),
  component: TablesDemoRoute,
});

function TablesDemoRoute() {
  const { page, pageSize, query = "", sortBy, sortDirection } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const onQueryChange = useCallback(
    (nextQuery: string) => {
      void navigate({
        search: (previous) => ({
          ...previous,
          page: 1,
          query: nextQuery || undefined,
        }),
      });
    },
    [navigate],
  );
  const onSortChange = useCallback(
    (nextSortBy: "title" | "createdAt" | "updatedAt", nextSortDirection: "asc" | "desc") => {
      void navigate({
        replace: true,
        search: (previous) => ({
          ...previous,
          page: 1,
          sortBy: nextSortBy,
          sortDirection: nextSortDirection,
        }),
      });
    },
    [navigate],
  );

  return (
    <TablesDemo
      onQueryChange={onQueryChange}
      onSortChange={onSortChange}
      page={page}
      pageSize={pageSize}
      query={query}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
}
