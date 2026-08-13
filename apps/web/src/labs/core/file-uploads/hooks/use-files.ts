import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

export function useFiles() {
  return useQuery({
    queryKey: queryKeys.files.all,
    queryFn: async () => {
      const response = await client.api.files.$get();
      return readJsonResponse(response, "Files could not be loaded");
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await client.api.files.$post({ form: { file } });
      return readJsonResponse(response, "The file could not be uploaded");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.files.all }),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api.files[":id"].$delete({ param: { id } });
      return readJsonResponse(response, "The file could not be deleted");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.files.all }),
  });
}
