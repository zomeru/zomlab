import { useQuery } from "@tanstack/react-query";
import { client } from "~/lib/api";

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<HealthData> => {
      const response = await client.api.health.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch health data");
      }

      return response.json();
    },
    refetchInterval: 30_000,
  });
}
