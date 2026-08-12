import { createFileRoute } from "@tanstack/react-router";
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
  return (
    <TablesDemo
      page={page}
      pageSize={pageSize}
      query={query}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
}
