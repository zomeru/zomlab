import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateNoteBody } from "@zomlab/contracts";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateNoteBody) => {
      const response = await client.api.notes[":id"].$patch({
        param: { id },
        json: input,
      });
      return readJsonResponse(response, "The note could not be updated");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists });
    },
  });
}
