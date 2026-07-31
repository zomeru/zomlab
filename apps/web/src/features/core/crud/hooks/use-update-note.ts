import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";
import { queryKeys } from "@/lib/query-keys";

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; content?: string }) => {
      const { data, error } = await api.notes({ id }).patch(input);

      if (error) {
        throw new Error(getApiErrorMessage(error, "Failed to update note"));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.note(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes() });
    },
  });
}
