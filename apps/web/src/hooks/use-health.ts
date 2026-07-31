import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";
import { queryKeys } from "@/lib/query-keys";

interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: async () => {
      const { data, error } = await api.health.get();

      if (error) {
        throw new Error(getApiErrorMessage(error, "Failed to fetch health status"));
      }

      return data as HealthResponse;
    },
  });
}
