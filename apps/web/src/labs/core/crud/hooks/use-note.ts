import { useQuery } from "@tanstack/react-query";
import { client } from "~/lib/api";

export function useNote(id: string) {
  return useQuery({
    queryKey: ["note", id],
    enabled: id.length > 0,
    queryFn: async () => {
      const response = await client.api.notes[":id"].$get({
        param: {
          id,
        },
      });
      const data = await response.json();
      return data;
    },
  });
}
