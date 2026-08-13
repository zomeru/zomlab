import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { NoteListQuery } from "@zomlab/contracts";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

export function useNotes(options: NoteListQuery = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: queryKeys.notes.list(options),
    queryFn: async () => {
      const response = await client.api.notes.$get({
        query: {
          ...(options.query ? { query: options.query } : {}),
          page: options.page,
          pageSize: options.pageSize,
          ...(options.sortBy ? { sortBy: options.sortBy } : {}),
          ...(options.sortDirection ? { sortDirection: options.sortDirection } : {}),
        },
      });
      return readJsonResponse(response, "Notes could not be loaded");
    },
    placeholderData: keepPreviousData,
  });
}
