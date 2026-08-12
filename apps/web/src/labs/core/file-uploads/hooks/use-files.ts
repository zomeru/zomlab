import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "~/lib/api";

export function useFiles() {
  return useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const response = await client.api.files.$get();
      if (!response.ok) throw new Error("Failed to load files");
      return response.json();
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await client.api.files.$post({ form: { file } });
      if (!response.ok) throw new Error("The file could not be uploaded");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api.files[":id"].$delete({ param: { id } });
      if (!response.ok) throw new Error("The file could not be deleted");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files"] }),
  });
}
