"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/api/error-message";
import { parseDecimalInput, precisionFor } from "@/lib/money";

import { useTopUp, useWithdraw } from "../api";
import type { WalletCurrency } from "../types";

export type FundingMode = "topup" | "withdraw";

interface FundingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: WalletCurrency;
  mode: FundingMode;
}

interface FundingFormValues {
  amount: string;
  reason: string;
}

export function FundingDialog({ open, onOpenChange, currency, mode }: FundingDialogProps) {
  const t = useTranslations("wallets");
  const tg = useTranslations();
  const locale = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);
  const topUp = useTopUp(currency);
  const withdraw = useWithdraw(currency);
  const mutation = mode === "topup" ? topUp : withdraw;

  const schema = useMemo(
    () =>
      z.object({
        amount: z.string().superRefine((raw, ctx) => {
          const parsed = parseDecimalInput(raw, locale);
          if (parsed === null) {
            ctx.addIssue({ code: "custom", message: t("amountInvalid") });
            return;
          }
          const value = new Decimal(parsed);
          if (!value.isFinite() || value.lte(0)) {
            ctx.addIssue({ code: "custom", message: t("amountPositive") });
            return;
          }
          const dp = precisionFor(currency);
          if (value.decimalPlaces() > dp) {
            ctx.addIssue({ code: "custom", message: t("amountPrecision", { dp }) });
          }
        }),
        reason: z.string().max(500, t("reasonTooLong")),
      }),
    [t, locale, currency],
  );

  const form = useForm<FundingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", reason: "" },
  });

  const onSubmit = (values: FundingFormValues) => {
    setServerError(null);
    const amount = parseDecimalInput(values.amount, locale);
    if (amount === null) return;
    mutation.mutate(
      { amount, reason: values.reason.trim() },
      {
        onSuccess: () => {
          toast.success(mode === "topup" ? t("topupSuccess") : t("withdrawSuccess"));
          form.reset();
          onOpenChange(false);
        },
        onError: (error) => setServerError(errorMessage(tg, error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "topup"
              ? t("topupTitle", { currency })
              : t("withdrawTitle", { currency })}
          </DialogTitle>
          <DialogDescription>
            {t("amountPrecision", { dp: precisionFor(currency) })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reason")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                {tg("common.cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mode === "topup" ? t("topup") : t("withdraw")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
