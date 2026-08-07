import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateNoteBody } from "@zomlab/contracts";
import { client } from "~/lib/api";

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNoteBody) => {
      const response = await client.api.notes.$post({
        json: input,
      });

      const data = await response.json();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
