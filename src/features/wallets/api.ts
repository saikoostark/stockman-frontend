import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type { Journal, Wallet } from "./types";

export const LEDGER_PAGE_SIZE = 20;

export function useWallets() {
  return useQuery<Wallet[]>({
    queryKey: ["wallets"],
    queryFn: () => api.get<Wallet[]>("/wallets/"),
  });
}

export function useLedger(currency: string, page: number) {
  return useQuery({
    queryKey: ["ledger", currency, page],
    queryFn: () =>
      api.getPage<Journal[]>(
        `/wallets/${currency}/ledger/?page=${page}&page_size=${LEDGER_PAGE_SIZE}`,
      ),
  });
}

export interface FundingValues {
  amount: string;
  reason: string;
}

export function useTopUp(currency: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FundingValues) =>
      api.post<Journal>(`/wallets/${currency}/topups/`, values, crypto.randomUUID()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallets"] }),
        queryClient.invalidateQueries({ queryKey: ["ledger", currency] }),
      ]);
    },
  });
}

export function useWithdraw(currency: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FundingValues) =>
      api.post<Journal>(`/wallets/${currency}/withdrawals/`, values, crypto.randomUUID()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallets"] }),
        queryClient.invalidateQueries({ queryKey: ["ledger", currency] }),
      ]);
    },
  });
}

export interface ReverseValues {
  id: string;
  currency: string;
  reason: string;
}

export function useReverseJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: ReverseValues) =>
      api.post<Journal>(`/wallets/journals/${id}/reverse/`, { reason }, crypto.randomUUID()),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallets"] }),
        queryClient.invalidateQueries({ queryKey: ["ledger", variables.currency] }),
      ]);
    },
  });
}
