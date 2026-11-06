import { z } from "zod";

import { ADMIN_ACTIONS } from "./types";

export const scopeFormSchema = z.object({
  action: z.enum(ADMIN_ACTIONS),
  ownership: z.enum(["own", "owner_groups", "all"]),
  markets: z.array(z.string()),
  currencies: z.array(z.string()),
});

export const groupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
  denyActions: z.array(z.string()),
  scopes: z.array(scopeFormSchema),
  reason: z.string().min(1, "Reason is required"),
});

export type ScopeFormValues = z.infer<typeof scopeFormSchema>;
export type GroupFormValues = z.infer<typeof groupFormSchema>;
