import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SearchFilterDemo } from "~/labs/core/search-filter/components/search-filter-demo";

export const Route = createFileRoute("/_authenticated/core/search-filter-demo")({
  validateSearch: z.object({
    query: z.string().trim().max(200).optional(),
  }),
  component: SearchFilterDemoRoute,
});

function SearchFilterDemoRoute() {
  const query = Route.useSearch().query ?? "";
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <SearchFilterDemo
      onQueryChange={(nextQuery) => {
        void navigate({
          replace: true,
          search: (previous) => ({
            ...previous,
            query: nextQuery || undefined,
          }),
        });
      }}
      query={query}
    />
  );
}
