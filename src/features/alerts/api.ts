import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type {
  Alert,
  CreateAlertInput,
  DeletedAlert,
  InstrumentListItem,
  InstrumentOption,
  UpdateAlertInput,
} from "./types";

export const ALERTS_PAGE_SIZE = 20;

export function useAlerts(page: number) {
  return useQuery({
    queryKey: ["alerts", page],
    queryFn: () =>
      api.getPage<Alert[]>(`/alerts/?page=${page}&page_size=${ALERTS_PAGE_SIZE}`),
  });
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: ["alerts", id],
    queryFn: () => api.get<Alert>(`/alerts/${id}/`),
    enabled: Boolean(id),
  });
}

/**
 * Instruments for the alert form. The endpoint returns an envelope; only the
 * id/symbol/name/currency fields are needed for the select options.
 */
export function useInstruments() {
  return useQuery({
    queryKey: ["instruments", "alert-options"],
    queryFn: async (): Promise<InstrumentOption[]> => {
      const envelope = await api.getPage<InstrumentListItem[]>("/instruments/?page_size=100");
      return envelope.data.map((item) => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        currency: item.currency,
      }));
    },
    staleTime: 60_000,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlertInput) => api.post<Alert>("/alerts/", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useUpdateAlert(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAlertInput) => api.patch<Alert>(`/alerts/${id}/`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<DeletedAlert>(`/alerts/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
