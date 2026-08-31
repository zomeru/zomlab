import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GenerateRealtimeNotificationBody,
  MarkAllRealtimeNotificationsReadResponse,
  RealtimeChatListResponse,
  RealtimeNotification,
  RealtimeNotificationListResponse,
} from "@zomlab/contracts";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";
import { markAllNotificationsLocally, mergeNotification } from "./client-utils";

export function useRealtimeChatHistory(roomId: string) {
  return useQuery({
    queryKey: queryKeys.realtime.chat(roomId),
    queryFn: async () =>
      readJsonResponse<RealtimeChatListResponse>(
        await client.api.realtime.chat.messages.$get({ query: { roomId } }),
        "Chat history could not be loaded",
      ),
  });
}

export function useRealtimeNotifications() {
  return useQuery({
    queryKey: queryKeys.realtime.notifications,
    queryFn: async () =>
      readJsonResponse<RealtimeNotificationListResponse>(
        await client.api.realtime.notifications.$get(),
        "Notifications could not be loaded",
      ),
  });
}

export function useGenerateRealtimeNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateRealtimeNotificationBody) =>
      readJsonResponse<RealtimeNotification>(
        await client.api.realtime.notifications.demo.$post({ json: data }),
        "Notification could not be generated",
      ),
    onSuccess: (notification) => {
      queryClient.setQueryData<RealtimeNotificationListResponse>(
        queryKeys.realtime.notifications,
        (current) => mergeNotification(current, notification),
      );
    },
  });
}

export function useMarkRealtimeNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      readJsonResponse<RealtimeNotification>(
        await client.api.realtime.notifications[":id"].read.$post({ param: { id } }),
        "Notification could not be marked read",
      ),
    onSuccess: (notification) => {
      queryClient.setQueryData<RealtimeNotificationListResponse>(
        queryKeys.realtime.notifications,
        (current) => mergeNotification(current, notification),
      );
    },
  });
}

export function useMarkAllRealtimeNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      readJsonResponse<MarkAllRealtimeNotificationsReadResponse>(
        await client.api.realtime.notifications["read-all"].$post(),
        "Notifications could not be marked read",
      ),
    onSuccess: (result) => {
      queryClient.setQueryData<RealtimeNotificationListResponse>(
        queryKeys.realtime.notifications,
        (current) => markAllNotificationsLocally(current, result.readAt),
      );
    },
  });
}
