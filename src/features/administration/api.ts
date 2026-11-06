import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type { ActionScope, Group, User } from "./types";

const PAGE_SIZE = 20;

function pageParams(page: number): string {
  return `?page=${page}&page_size=${PAGE_SIZE}`;
}

/** Invalidate everything that can change when access management mutates. */
function useInvalidateAccess() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["groups"] }),
      queryClient.invalidateQueries({ queryKey: ["users"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
      queryClient.invalidateQueries({ queryKey: ["capabilities"] }),
    ]);
  };
}

export function useGroups(page: number, enabled = true) {
  return useQuery({
    queryKey: ["groups", page],
    queryFn: () => api.getPage<Group[]>(`/administration/groups/${pageParams(page)}`),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** All groups in one page — used by membership pickers. */
export function useAllGroups(enabled = true) {
  return useQuery({
    queryKey: ["groups", "all"],
    queryFn: () =>
      api.getPage<Group[]>("/administration/groups/?page=1&page_size=200").then((r) => r.data),
    enabled,
  });
}

export function useGroup(id: number, enabled = true) {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => api.get<Group>(`/administration/groups/${id}/`),
    enabled,
  });
}

export interface GroupMutationValues {
  name: string;
  permissions: string[];
  attributes: { schema_version: number; scopes: Record<string, ActionScope>; deny_actions: string[] };
  reason: string;
}

export function useCreateGroup() {
  const invalidate = useInvalidateAccess();
  return useMutation({
    mutationFn: (values: GroupMutationValues) =>
      api.post<Group>("/administration/groups/", values),
    onSuccess: invalidate,
  });
}

export function useUpdateGroup(id: number) {
  const invalidate = useInvalidateAccess();
  return useMutation({
    mutationFn: (values: GroupMutationValues) =>
      api.patch<Group>(`/administration/groups/${id}/`, values),
    onSuccess: invalidate,
  });
}

export function useUsers(page: number, enabled = true) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: () => api.getPage<User[]>(`/administration/users/${pageParams(page)}`),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export interface MembershipValues {
  group_ids: number[];
  is_active: boolean;
  reason: string;
}

export function useUpdateMembership(userId: number) {
  const invalidate = useInvalidateAccess();
  return useMutation({
    mutationFn: (values: MembershipValues) =>
      api.patch<User>(`/administration/users/${userId}/groups/`, values),
    onSuccess: invalidate,
  });
}
