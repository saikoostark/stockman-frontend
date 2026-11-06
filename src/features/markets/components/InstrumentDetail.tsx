"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  OrderTicket,
  type OrderTicketInstrument,
} from "@/features/trading/components/OrderTicket";
import { errorMessage } from "@/lib/api/error-message";
import { formatMoney } from "@/lib/money/format";

import {
  useInstrument,
  useInstrumentHistory,
  useUpdateCatalog,
  type HistoryKind,
} from "../api";
import { availabilityBadgeVariant, normalizeAvailability } from "../availability";
import type { CandleView, ObservationView } from "../types";
import { PriceHistoryChart } from "./PriceHistoryChart";

const catalogSchema = z.object({
  name: z.string().min(1).max(200),
  enabled: z.boolean(),
  watched: z.boolean(),
  reason: z.string().min(1),
});
type CatalogValues = z.infer<typeof catalogSchema>;

export function InstrumentDetail({ instrumentId }: { instrumentId: string }) {
  const t = useTranslations("markets");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { can } = useAuth();
  const canRead = can("markets.read");

  const [kind, setKind] = useState<HistoryKind>("observations");
  const instrument = useInstrument(instrumentId, canRead);
  const history = useInstrumentHistory(instrumentId, kind, 1, canRead);
  const updateCatalog = useUpdateCatalog();

  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  const form = useForm<CatalogValues>({
    resolver: zodResolver(catalogSchema),
    values: {
      name: instrument.data?.name ?? "",
      enabled: instrument.data?.enabled ?? false,
      watched: instrument.data?.watched ?? false,
      reason: "",
    },
  });

  if (!canRead) return null;

  if (instrument.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (instrument.isError || !instrument.data) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {errorMessage(t, instrument.error)}
      </p>
    );
  }

  const instrumentData = instrument.data;
  const availability = normalizeAvailability(instrumentData.availability);
  const quote = instrumentData.quote;
  const historyPoints = history.data?.data ?? [];

  const ticketInstrument: OrderTicketInstrument = {
    id: instrumentData.id,
    symbol: instrumentData.symbol,
    currency: instrumentData.currency,
    price_scale: instrumentData.price_scale,
    quantity_scale: instrumentData.quantity_scale,
    price_step: instrumentData.price_step,
    quantity_step: instrumentData.quantity_step,
    minimum_quantity: instrumentData.minimum_quantity,
    minimum_notional: instrumentData.minimum_notional,
    quote: quote
      ? { price: quote.price, tradable: quote.tradable, stale: quote.stale }
      : null,
  };

  const onSubmit = (values: CatalogValues) => {
    updateCatalog.mutate(
      { id: instrumentId, payload: values },
      {
        onSuccess: () => {
          toast.success(tc("saved"));
          form.setValue("reason", "");
        },
        onError: (error) => toast.error(errorMessage(t, error)),
      },
    );
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{instrumentData.name}</CardTitle>
          <CardDescription>{instrumentData.symbol}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("quote")}</p>
            <p className="text-3xl font-semibold tabular-nums">
              {quote
                ? formatMoney(quote.price, instrumentData.currency, locale)
                : "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={availabilityBadgeVariant(availability)}>
                {t(`availability.${availability}`)}
              </Badge>
              {quote &&
                (quote.tradable ? (
                  <Badge variant="outline">{t("tradable")}</Badge>
                ) : (
                  <Badge variant="secondary">{t("notTradable")}</Badge>
                ))}
              {quote?.stale && (
                <Badge variant="destructive">{t("staleQuote")}</Badge>
              )}
              <Badge variant="outline">{instrumentData.data_mode}</Badge>
            </div>
            {availability !== "AVAILABLE" && instrumentData.reason && (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {instrumentData.reason}
              </p>
            )}
          </div>
          <dl className="grid gap-1 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("source")}:</dt>
              <dd>{quote?.source ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("sourceTime")}:</dt>
              <dd>{quote ? dateTime.format(new Date(quote.source_at)) : "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("receivedTime")}:</dt>
              <dd>
                {quote ? dateTime.format(new Date(quote.received_at)) : "—"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("delay")}:</dt>
              <dd>{instrumentData.delay_seconds}s</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("providerStatus")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-1 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("provider")}:</dt>
              <dd>{instrumentData.provider}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("dataMode")}:</dt>
              <dd>{instrumentData.data_mode}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("venueTimezone")}:</dt>
              <dd>{instrumentData.venue_timezone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("cadence")}:</dt>
              <dd>{instrumentData.cadence_seconds}s</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("history")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs
            value={kind}
            onValueChange={(value) => setKind(value as HistoryKind)}
          >
            <TabsList>
              <TabsTrigger value="observations">
                {t("observations")}
              </TabsTrigger>
              <TabsTrigger value="candles">{t("candles")}</TabsTrigger>
            </TabsList>
            <TabsContent value="observations">
              {history.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage(t, history.error)}
                </p>
              ) : (
                <PriceHistoryChart
                  kind="observations"
                  points={historyPoints as ObservationView[]}
                />
              )}
            </TabsContent>
            <TabsContent value="candles">
              {history.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage(t, history.error)}
                </p>
              ) : (
                <PriceHistoryChart
                  kind="candles"
                  points={historyPoints as CandleView[]}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <OrderTicket instrument={ticketInstrument} />

      {can("catalog.manage") && (
        <Card>
          <CardHeader>
            <CardTitle>{t("catalogTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <FormLabel>{t("enabled")}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="watched"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <FormLabel>{t("watched")}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tc("reason")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={updateCatalog.isPending}
                  className="w-fit"
                >
                  {updateCatalog.isPending ? tc("saving") : tc("save")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
