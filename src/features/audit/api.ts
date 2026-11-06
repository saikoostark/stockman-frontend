import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import type { AuditEvent } from "./types";

export interface AuditFilters {
  action: string;
  target_type: string;
}

export const AUDIT_PAGE_SIZE = 20;

export function useAudit(filters: AuditFilters, page: number, enabled = true) {
  return useQuery({
    queryKey: ["audit", filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(AUDIT_PAGE_SIZE),
      });
      const action = filters.action.trim();
      const targetType = filters.target_type.trim();
      if (action) params.set("action", action);
      if (targetType) params.set("target_type", targetType);
      return api.getPage<AuditEvent[]>(`/audit/?${params.toString()}`);
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}
