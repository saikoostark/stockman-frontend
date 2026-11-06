import Decimal from "decimal.js";
import { z } from "zod";

import { parseDecimalInput } from "@/lib/money/parse";

import type { AlertKind } from "./types";

export const ALERT_KINDS = [
  "PRICE_ABOVE",
  "PRICE_BELOW",
  "PERCENT_RISE",
  "PERCENT_DROP",
] as const;

export const PERCENT_KINDS: readonly AlertKind[] = ["PERCENT_RISE", "PERCENT_DROP"];

/**
 * Form schema for creating/editing an alert. Number fields stay raw strings so
 * locale-formatted input (Arabic digits, de/es separators) can be validated
 * and converted to canonical decimal strings at submit time.
 */
export function alertFormSchema(locale: string) {
  return z.object({
    instrument_id: z.string().min(1, "Select an instrument"),
    kind: z.enum(ALERT_KINDS),
    threshold: z
      .string()
      .min(1, "Required")
      .refine((value) => {
        const parsed = parseDecimalInput(value, locale);
        return parsed !== null && new Decimal(parsed).gt(0);
      }, "Enter a positive number"),
    window_seconds: z
      .string()
      .refine((value) => {
        const trimmed = value.trim();
        return trimmed === "" || (/^\d+$/.test(trimmed) && Number(trimmed) >= 1);
      }, "Enter a whole number of seconds (at least 1)"),
    cooldown_seconds: z
      .string()
      .min(1, "Required")
      .refine((value) => /^\d+$/.test(value.trim()), "Enter a whole number of seconds"),
    enabled: z.boolean(),
  });
}

export type AlertFormValues = z.infer<ReturnType<typeof alertFormSchema>>;
