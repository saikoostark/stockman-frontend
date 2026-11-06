import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

import type { Capabilities, Me } from "./types";

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api.get<Me>("/auth/me/");
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useCapabilities(enabled: boolean) {
  return useQuery<Capabilities | null>({
    queryKey: ["capabilities"],
    queryFn: async () => {
      try {
        return await api.get<Capabilities>("/auth/capabilities/");
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) return null;
        throw error;
      }
    },
    enabled,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { username: string; password: string }) =>
      api.post<Me>("/auth/login/", values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["capabilities"] }),
      ]);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { username: string; password: string; email: string; locale: string }) =>
      api.post<Me>("/auth/register/", values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["capabilities"] }),
      ]);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<unknown>("/auth/logout/"),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (values: { current_password: string; new_password: string }) =>
      api.post<unknown>("/auth/password/", values),
  });
}

export function useSetLocale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locale: string) => api.patch<Me>("/auth/preferences/", { locale }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
