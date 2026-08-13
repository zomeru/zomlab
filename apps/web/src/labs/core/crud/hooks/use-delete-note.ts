import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api.notes[":id"].$delete({
        param: {
          id,
        },
      });
      return readJsonResponse(response, "The note could not be deleted");
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists });
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(id) });
    },
  });
}
