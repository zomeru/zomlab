import { useQuery } from "@tanstack/react-query";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

export function useNote(id: string) {
  return useQuery({
    queryKey: queryKeys.notes.detail(id),
    enabled: id.length > 0,
    queryFn: async () => {
      const response = await client.api.notes[":id"].$get({
        param: {
          id,
        },
      });
      return readJsonResponse(response, "The note could not be loaded");
    },
  });
}
