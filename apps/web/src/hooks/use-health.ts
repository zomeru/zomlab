import { useQuery } from "@tanstack/react-query";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health.all,
    queryFn: async (): Promise<HealthData> => {
      const response = await client.api.health.$get();
      return readJsonResponse(response, "Health data is unavailable");
    },
    refetchInterval: 30_000,
  });
}
