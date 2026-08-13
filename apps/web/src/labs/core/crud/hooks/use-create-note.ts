import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateNoteBody } from "@zomlab/contracts";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNoteBody) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.lists });
      const response = await client.api.notes.$post({
        json: input,
      });

      return readJsonResponse(response, "The note could not be created");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists }),
  });
}
