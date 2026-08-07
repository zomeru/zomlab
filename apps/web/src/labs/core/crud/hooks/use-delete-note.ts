import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "~/lib/api";

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.api.notes[":id"].$delete({
        param: {
          id,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
