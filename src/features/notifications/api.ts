import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type { Notification } from "./types";

export const NOTIFICATIONS_PAGE_SIZE = 20;

export function useNotifications(page: number) {
  return useQuery({
    queryKey: ["notifications", page],
    queryFn: () =>
      api.getPage<Notification[]>(
        `/notifications/?page=${page}&page_size=${NOTIFICATIONS_PAGE_SIZE}`,
      ),
  });
}

export function useMarkRead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<unknown>(`/notifications/${id}/read/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
