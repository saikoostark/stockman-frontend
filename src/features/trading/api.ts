import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type { Fill, Order, PortfolioCurrency } from "./types";

export const ORDERS_PAGE_SIZE = 25;
export const FILLS_PAGE_SIZE = 25;

export function useOrders(page: number) {
  return useQuery({
    queryKey: ["orders", page],
    queryFn: () => api.getPage<Order[]>(`/orders/?page=${page}&page_size=${ORDERS_PAGE_SIZE}`),
  });
}

export function useFills(page: number) {
  return useQuery({
    queryKey: ["fills", page],
    queryFn: () => api.getPage<Fill[]>(`/fills/?page=${page}&page_size=${FILLS_PAGE_SIZE}`),
  });
}

export function usePortfolio() {
  return useQuery<PortfolioCurrency[]>({
    queryKey: ["portfolio"],
    queryFn: () => api.get<PortfolioCurrency[]>("/portfolio/"),
  });
}

export interface PlaceOrderPayload {
  instrument_id: string;
  side: "BUY" | "SELL";
  order_type: "MARKET" | "LIMIT";
  quantity?: string;
  limit_price?: string;
  budget?: string;
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PlaceOrderPayload) =>
      api.post<Order>("/orders/", values, crypto.randomUUID()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["fills"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
        queryClient.invalidateQueries({ queryKey: ["wallets"] }),
      ]);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ order_id }: { order_id: string }) =>
      api.post<Order>(`/orders/${order_id}/cancel/`, {}, crypto.randomUUID()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["fills"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
        queryClient.invalidateQueries({ queryKey: ["wallets"] }),
      ]);
    },
  });
}
