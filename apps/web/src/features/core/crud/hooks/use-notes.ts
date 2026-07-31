import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";
import { queryKeys } from "@/lib/query-keys";

export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes(),
    queryFn: async () => {
      const { data, error } = await api.notes.get();

      if (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load notes"));
      }

      return data ?? [];
    },
  });
}
