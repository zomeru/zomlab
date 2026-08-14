import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PaginationDemo } from "~/labs/core/pagination/components/pagination-demo";

export const Route = createFileRoute("/_authenticated/core/pagination-demo")({
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    pageSize: z.coerce.number().int().min(1).max(10).catch(5),
  }),
  component: PaginationDemoRoute,
});

function PaginationDemoRoute() {
  const { page, pageSize } = Route.useSearch();
  return <PaginationDemo page={page} pageSize={pageSize} />;
}
