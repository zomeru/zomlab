import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";
import { queryKeys } from "@/lib/query-keys";

export function useNote(id: string) {
  return useQuery({
    queryKey: queryKeys.note(id),
    enabled: id.length > 0,
    queryFn: async () => {
      const { data, error } = await api.notes({ id }).get();

      if (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load note"));
      }

      return data;
    },
  });
}
