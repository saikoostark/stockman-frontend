import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type ApiEnvelope } from "@/lib/api/client";

import type {
  CandleView,
  CurrencyCode,
  InstrumentView,
  MarketCode,
  ObservationView,
  ProviderView,
  WatchView,
} from "./types";

export interface InstrumentFilters {
  market?: MarketCode | "";
  currency?: CurrencyCode | "";
  search?: string;
  enabled?: boolean;
}

export type HistoryKind = "observations" | "candles";

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    searchParams.set(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function useInstruments(
  filters: InstrumentFilters,
  page = 1,
  enabled = true,
) {
  return useQuery<ApiEnvelope<InstrumentView[]>>({
    queryKey: ["instruments", filters, page],
    queryFn: () =>
      api.getPage<InstrumentView[]>(
        `/instruments/${buildQuery({ ...filters, page })}`,
      ),
    enabled,
  });
}

export function useInstrument(id: string, enabled = true) {
  return useQuery<InstrumentView>({
    queryKey: ["instrument", id],
    queryFn: () => api.get<InstrumentView>(`/instruments/${id}/`),
    enabled: enabled && Boolean(id),
  });
}

export function useInstrumentHistory(
  id: string,
  kind: HistoryKind,
  page = 1,
  enabled = true,
) {
  return useQuery<ApiEnvelope<ObservationView[] | CandleView[]>>({
    queryKey: ["instrument-history", id, kind, page],
    queryFn: () =>
      api.getPage<ObservationView[] | CandleView[]>(
        `/instruments/${id}/history/${buildQuery({ kind, page })}`,
      ),
    enabled: enabled && Boolean(id),
  });
}

export function useWatchlist(page = 1, enabled = true) {
  return useQuery<ApiEnvelope<WatchView[]>>({
    queryKey: ["watchlist", page],
    queryFn: () =>
      api.getPage<WatchView[]>(`/watchlist/${buildQuery({ page })}`),
    enabled,
  });
}

export function useProviders(enabled = true) {
  return useQuery<ProviderView[]>({
    queryKey: ["providers"],
    queryFn: () => api.get<ProviderView[]>("/providers/"),
    enabled,
  });
}

export function useAddWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instrumentId: string) =>
      api.post<unknown>("/watchlist/", { instrument_id: instrumentId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
        queryClient.invalidateQueries({ queryKey: ["instruments"] }),
      ]);
    },
  });
}

export function useRemoveWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instrumentId: string) =>
      api.delete<unknown>(`/watchlist/${instrumentId}/`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
        queryClient.invalidateQueries({ queryKey: ["instruments"] }),
      ]);
    },
  });
}

export interface CatalogUpdate {
  name?: string;
  enabled?: boolean;
  watched?: boolean;
  reason: string;
}

export function useUpdateCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CatalogUpdate }) =>
      api.patch<InstrumentView>(`/instruments/${id}/`, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["instruments"] }),
        queryClient.invalidateQueries({
          queryKey: ["instrument", variables.id],
        }),
      ]);
    },
  });
}
