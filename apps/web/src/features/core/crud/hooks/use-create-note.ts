import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";
import { queryKeys } from "@/lib/query-keys";

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; content?: string }) => {
      const { data, error } = await api.notes.post(input);

      if (error) {
        throw new Error(getApiErrorMessage(error, "Failed to create note"));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes() });
    },
  });
}
