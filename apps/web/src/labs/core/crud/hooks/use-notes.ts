import { useQuery } from "@tanstack/react-query";
import { client } from "~/lib/api";

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await client.api.notes.$get();
      const data = await response.json();
      return data;
    },
  });
}
