import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateNoteBody } from "@zomlab/contracts";
import { client } from "~/lib/api";

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateNoteBody) => {
      const response = await client.api.notes[":id"].$patch({
        param: { id },
        json: input,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}