import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
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
  const onQueryChange = useCallback(
    (nextQuery: string) => {
      void navigate({
        search: (previous) => ({
          ...previous,
          query: nextQuery || undefined,
        }),
      });
    },
    [navigate],
  );

  return <SearchFilterDemo onQueryChange={onQueryChange} query={query} />;
}
