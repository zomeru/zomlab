import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { NoteListQuery } from "@zomlab/contracts";
import { client } from "~/lib/api";

export function useNotes(options: NoteListQuery = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: ["notes", options],
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
      const data = await response.json();
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
