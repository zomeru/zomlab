import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "~/lib/api";

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { title: string; content?: string }) =>
      apiFetch(`/api/notes/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
