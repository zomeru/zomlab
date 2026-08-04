import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";
import { queryKeys } from "@/lib/query-keys";

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.notes({ id }).delete();

      if (error) {
        throw new Error(getApiErrorMessage(error, "Failed to delete note"));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes() });
    },
  });
}
