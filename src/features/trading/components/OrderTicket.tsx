"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api/error-message";
import {
  formatDecimal,
  formatMoney,
  formatNumber,
  parseDecimalInput,
  precisionFor,
} from "@/lib/money";

import { usePlaceOrder, type PlaceOrderPayload } from "../api";

export interface OrderTicketInstrument {
  id: string;
  symbol: string;
  currency: string;
  price_scale: number;
  quantity_scale: number;
  price_step: string;
  quantity_step: string;
  minimum_quantity: string;
  minimum_notional: string;
  quote: { price: string; tradable: boolean; stale: boolean } | null;
}

type Side = "BUY" | "SELL";
type OrderType = "MARKET" | "LIMIT";

interface OrderTicketValues {
  side: Side;
  order_type: OrderType;
  quantity: string;
  limit_price: string;
  budget: string;
}

export function OrderTicket({ instrument }: { instrument: OrderTicketInstrument }) {
  const t = useTranslations("trading");
  const tg = useTranslations();
  const locale = useLocale();
  const { can } = useAuth();
  const placeOrder = usePlaceOrder();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          side: z.enum(["BUY", "SELL"]),
          order_type: z.enum(["MARKET", "LIMIT"]),
          quantity: z.string(),
          limit_price: z.string(),
          budget: z.string(),
        })
        .superRefine((values, ctx) => {
          const needsQuantity =
            values.order_type === "LIMIT" || values.side === "SELL";
          const needsBudget =
            values.order_type === "MARKET" && values.side === "BUY";
          const needsPrice = values.order_type === "LIMIT";

          if (needsQuantity) {
            const parsed = parseDecimalInput(values.quantity, locale);
            if (parsed === null) {
              ctx.addIssue({
                code: "custom",
                message: t("quantityInvalid"),
                path: ["quantity"],
              });
            } else {
              const value = new Decimal(parsed);
              if (!value.isFinite() || value.lte(0)) {
                ctx.addIssue({
                  code: "custom",
                  message: t("quantityPositive"),
                  path: ["quantity"],
                });
              } else if (value.lt(instrument.minimum_quantity)) {
                ctx.addIssue({
                  code: "custom",
                  message: t("quantityMin", {
                    min: formatNumber(instrument.minimum_quantity, locale),
                  }),
                  path: ["quantity"],
                });
              } else if (!value.mod(instrument.quantity_step).isZero()) {
                ctx.addIssue({
                  code: "custom",
                  message: t("quantityStep", {
                    step: formatNumber(instrument.quantity_step, locale),
                  }),
                  path: ["quantity"],
                });
              }
            }
          }

          if (needsPrice) {
            const parsed = parseDecimalInput(values.limit_price, locale);
            if (parsed === null) {
              ctx.addIssue({
                code: "custom",
                message: t("priceInvalid"),
                path: ["limit_price"],
              });
            } else {
              const value = new Decimal(parsed);
              if (!value.isFinite() || value.lte(0)) {
                ctx.addIssue({
                  code: "custom",
                  message: t("pricePositive"),
                  path: ["limit_price"],
                });
              } else if (!value.mod(instrument.price_step).isZero()) {
                ctx.addIssue({
                  code: "custom",
                  message: t("priceStep", {
                    step: formatDecimal(
                      instrument.price_step,
                      locale,
                      instrument.price_scale,
                    ),
                  }),
                  path: ["limit_price"],
                });
              }
            }
          }

          if (needsBudget) {
            const parsed = parseDecimalInput(values.budget, locale);
            if (parsed === null) {
              ctx.addIssue({
                code: "custom",
                message: t("budgetInvalid"),
                path: ["budget"],
              });
            } else {
              const value = new Decimal(parsed);
              if (!value.isFinite() || value.lte(0)) {
                ctx.addIssue({
                  code: "custom",
                  message: t("budgetPositive"),
                  path: ["budget"],
                });
              } else if (value.lt(instrument.minimum_notional)) {
                ctx.addIssue({
                  code: "custom",
                  message: t("budgetMin", {
                    min: formatMoney(
                      instrument.minimum_notional,
                      instrument.currency,
                      locale,
                    ),
                  }),
                  path: ["budget"],
                });
              } else if (value.decimalPlaces() > precisionFor(instrument.currency)) {
                ctx.addIssue({
                  code: "custom",
                  message: t("budgetPrecision", {
                    dp: precisionFor(instrument.currency),
                  }),
                  path: ["budget"],
                });
              }
            }
          }
        }),
    [t, locale, instrument],
  );

  const form = useForm<OrderTicketValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      side: "BUY",
      order_type: "MARKET",
      quantity: "",
      limit_price: "",
      budget: "",
    },
  });

  const side = useWatch({ control: form.control, name: "side" });
  const orderType = useWatch({ control: form.control, name: "order_type" });
  const quantityRaw = useWatch({ control: form.control, name: "quantity" });
  const limitPriceRaw = useWatch({ control: form.control, name: "limit_price" });
  const budgetRaw = useWatch({ control: form.control, name: "budget" });

  const quote = instrument.quote;
  const quoteBlocked = quote === null || quote.stale || !quote.tradable;
  const blockReason =
    quote === null
      ? t("quoteUnavailable")
      : quote.stale
        ? t("quoteStale")
        : !quote.tradable
          ? t("notTradable")
          : null;
  const disabled = !can("trading.place") || quoteBlocked;

  const isMarketBuy = orderType === "MARKET" && side === "BUY";
  const isMarketSell = orderType === "MARKET" && side === "SELL";
  const isLimit = orderType === "LIMIT";

  let estimatedQuantity: string | null = null;
  if (isMarketBuy && quote !== null) {
    const parsedBudget = parseDecimalInput(budgetRaw, locale);
    if (parsedBudget !== null && new Decimal(quote.price).gt(0)) {
      estimatedQuantity = new Decimal(parsedBudget)
        .div(quote.price)
        .toDecimalPlaces(instrument.quantity_scale, Decimal.ROUND_DOWN)
        .toString();
    }
  }

  let estimatedCost: string | null = null;
  if (isLimit) {
    const parsedQuantity = parseDecimalInput(quantityRaw, locale);
    const parsedPrice = parseDecimalInput(limitPriceRaw, locale);
    if (parsedQuantity !== null && parsedPrice !== null) {
      estimatedCost = new Decimal(parsedQuantity)
        .mul(parsedPrice)
        .toDecimalPlaces(precisionFor(instrument.currency), Decimal.ROUND_HALF_UP)
        .toString();
    }
  }

  const onSubmit = (values: OrderTicketValues) => {
    setServerError(null);
    const payload: PlaceOrderPayload = {
      instrument_id: instrument.id,
      side: values.side,
      order_type: values.order_type,
    };
    if (values.order_type === "LIMIT") {
      const quantity = parseDecimalInput(values.quantity, locale);
      const limitPrice = parseDecimalInput(values.limit_price, locale);
      if (quantity === null || limitPrice === null) return;
      payload.quantity = quantity;
      payload.limit_price = limitPrice;
    } else if (values.side === "SELL") {
      const quantity = parseDecimalInput(values.quantity, locale);
      if (quantity === null) return;
      payload.quantity = quantity;
    } else {
      const budget = parseDecimalInput(values.budget, locale);
      if (budget === null) return;
      payload.budget = budget;
    }
    placeOrder.mutate(payload, {
      onSuccess: () => {
        toast.success(t("orderPlaced"));
        form.reset({
          side: values.side,
          order_type: values.order_type,
          quantity: "",
          limit_price: "",
          budget: "",
        });
      },
      onError: (error) => setServerError(errorMessage(tg, error)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {instrument.symbol} · {t("placeOrder")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {quote !== null && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">{t("currentPrice")}</span>
            <span className="font-medium">
              {formatDecimal(quote.price, locale, instrument.price_scale)}
            </span>
          </div>
        )}
        {blockReason !== null && (
          <Alert variant="destructive">
            <AlertDescription>{blockReason}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("side")}</Label>
              <Tabs
                value={side}
                onValueChange={(value) =>
                  form.setValue("side", value as Side, { shouldValidate: false })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="BUY">{t("sideBuy")}</TabsTrigger>
                  <TabsTrigger value="SELL">{t("sideSell")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="grid gap-2">
              <Label>{t("orderType")}</Label>
              <Tabs
                value={orderType}
                onValueChange={(value) =>
                  form.setValue("order_type", value as OrderType, {
                    shouldValidate: false,
                  })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="MARKET">
                    {side === "BUY" ? t("marketBuy") : t("marketSell")}
                  </TabsTrigger>
                  <TabsTrigger value="LIMIT">
                    {side === "BUY" ? t("limitBuy") : t("limitSell")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isMarketBuy && (
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budget")}</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" autoComplete="off" {...field} />
                    </FormControl>
                    <FormDescription>{t("budgetHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isMarketSell && (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quantity")}</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" autoComplete="off" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t("quantityHint", {
                        min: formatNumber(instrument.minimum_quantity, locale),
                        step: formatNumber(instrument.quantity_step, locale),
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isLimit && (
              <>
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quantity")}</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" autoComplete="off" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("quantityHint", {
                          min: formatNumber(instrument.minimum_quantity, locale),
                          step: formatNumber(instrument.quantity_step, locale),
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="limit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("limitPrice")}</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" autoComplete="off" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("priceHint", {
                          step: formatDecimal(
                            instrument.price_step,
                            locale,
                            instrument.price_scale,
                          ),
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {estimatedQuantity !== null && (
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{t("estimatedQuantity")}</span>
                <span className="font-medium">
                  {formatDecimal(
                    estimatedQuantity,
                    locale,
                    instrument.quantity_scale,
                  )}
                </span>
              </div>
            )}
            {estimatedCost !== null && (
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{t("estimatedCost")}</span>
                <span className="font-medium">
                  {formatMoney(estimatedCost, instrument.currency, locale)}
                </span>
              </div>
            )}

            {serverError && (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}
            <Button type="submit" disabled={disabled || placeOrder.isPending}>
              {placeOrder.isPending ? tg("common.loading") : t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
