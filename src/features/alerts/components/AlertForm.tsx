"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/lib/api/error-message";
import { formatMoney, formatNumber } from "@/lib/money/format";
import { parseDecimalInput } from "@/lib/money/parse";

import { useCreateAlert, useInstruments, useUpdateAlert } from "../api";
import { ALERT_KINDS, alertFormSchema, PERCENT_KINDS, type AlertFormValues } from "../schemas";
import type { Alert, AlertKind, CreateAlertInput } from "../types";

interface AlertFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing alert to edit; null creates a new one. */
  alert: Alert | null;
}

function isPercentKind(kind: AlertKind): boolean {
  return PERCENT_KINDS.includes(kind);
}

function buildDefaults(alert: Alert | null, locale: string): AlertFormValues {
  if (!alert) {
    return {
      instrument_id: "",
      kind: "PRICE_ABOVE",
      threshold: "",
      window_seconds: "",
      cooldown_seconds: "0",
      enabled: true,
    };
  }
  return {
    instrument_id: alert.instrument_id,
    kind: alert.kind,
    threshold: isPercentKind(alert.kind)
      ? formatNumber(alert.threshold, locale)
      : formatMoney(alert.threshold, alert.currency, locale),
    window_seconds: alert.window_seconds?.toString() ?? "",
    cooldown_seconds: alert.cooldown_seconds.toString(),
    enabled: alert.enabled,
  };
}

export function AlertForm({ open, onOpenChange, alert }: AlertFormProps) {
  const t = useTranslations("alerts");
  const tGlobal = useTranslations();
  const locale = useLocale();

  const instruments = useInstruments();
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert(alert?.id ?? "");
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(() => alertFormSchema(locale), [locale]);

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(alert, locale),
  });

  const kind = useWatch({ control: form.control, name: "kind" });
  const instrumentId = useWatch({ control: form.control, name: "instrument_id" });
  const selectedInstrument = instruments.data?.find((item) => item.id === instrumentId);

  const onSubmit = (values: AlertFormValues) => {
    setServerError(null);
    // The schema guarantees this parses; convert to the canonical decimal string.
    const threshold = parseDecimalInput(values.threshold, locale);
    if (threshold === null) return;

    const payload: CreateAlertInput = {
      instrument_id: values.instrument_id,
      kind: values.kind,
      threshold,
      window_seconds: isPercentKind(values.kind)
        ? values.window_seconds.trim() === ""
          ? null
          : Number(values.window_seconds.trim())
        : null,
      cooldown_seconds: values.cooldown_seconds.trim() === "" ? 0 : Number(values.cooldown_seconds.trim()),
      enabled: values.enabled,
    };

    const mutationOptions = {
      onSuccess: () => {
        toast.success(alert ? t("updated") : t("created"));
        onOpenChange(false);
      },
      onError: (error: unknown) => setServerError(errorMessage(tGlobal, error)),
    };

    if (alert) {
      updateAlert.mutate(payload, mutationOptions);
    } else {
      createAlert.mutate(payload, mutationOptions);
    }
  };

  const isPending = createAlert.isPending || updateAlert.isPending;
  const thresholdLabel = isPercentKind(kind) ? t("thresholdPercent") : t("thresholdPrice");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{alert ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {isPercentKind(kind) ? t("windowHint") : t("thresholdPrice")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="instrument_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("instrument")}</FormLabel>
                  {instruments.isPending ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} disabled={instruments.isError}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("instrument")} />
                        </SelectTrigger>
                        <SelectContent>
                          {(instruments.data ?? []).map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.symbol} · {option.name} ({option.currency})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("kind")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_KINDS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`kind${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {thresholdLabel}
                    {!isPercentKind(kind) && selectedInstrument
                      ? ` (${selectedInstrument.currency})`
                      : ""}
                  </FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder={isPercentKind(kind) ? "5" : "0.00"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isPercentKind(kind) && (
              <FormField
                control={form.control}
                name="window_seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("window")}</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="3600" {...field} />
                    </FormControl>
                    <FormDescription>{t("windowHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="cooldown_seconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cooldown")}</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>{t("enabled")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError && (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tGlobal("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {tGlobal("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
