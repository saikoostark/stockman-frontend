"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/AuthProvider";
import { Link } from "@/i18n/navigation";
import { errorMessage } from "@/lib/api/error-message";
import { formatMoney } from "@/lib/money/format";

import { useAddWatch, useInstruments, useRemoveWatch } from "../api";
import { availabilityBadgeVariant, normalizeAvailability } from "../availability";
import type { CurrencyCode, InstrumentView, MarketCode } from "../types";

export function InstrumentsList() {
  const t = useTranslations("markets");
  const locale = useLocale();
  const { can } = useAuth();
  const canRead = can("markets.read");

  const [market, setMarket] = useState<MarketCode | "">("");
  const [currency, setCurrency] = useState<CurrencyCode | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingWatch, setPendingWatch] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const instruments = useInstruments(
    {
      market: market || undefined,
      currency: currency || undefined,
      search: search || undefined,
    },
    page,
    canRead,
  );
  const addWatch = useAddWatch();
  const removeWatch = useRemoveWatch();

  if (!canRead) return null;

  const toggleWatch = (instrument: InstrumentView) => {
    setPendingWatch(instrument.id);
    const request = instrument.watched
      ? removeWatch.mutateAsync(instrument.id)
      : addWatch.mutateAsync(instrument.id);
    request
      .catch((error) => toast.error(errorMessage(t, error)))
      .finally(() => setPendingWatch(null));
  };

  const pagination = instruments.data?.metadata.pagination;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.count / pagination.page_size))
    : 1;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={market || "all"}
          onValueChange={(value) => {
            setMarket(value === "all" ? "" : (value as MarketCode));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label={t("market")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allMarkets")}</SelectItem>
            <SelectItem value="CRYPTO">CRYPTO</SelectItem>
            <SelectItem value="EGX">EGX</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={currency || "all"}
          onValueChange={(value) => {
            setCurrency(value === "all" ? "" : (value as CurrencyCode));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label={t("currency")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCurrencies")}</SelectItem>
            <SelectItem value="USDT">USDT</SelectItem>
            <SelectItem value="EGP">EGP</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:w-64"
        />
      </div>

      {market === "EGX" && (
        <p className="text-sm text-muted-foreground">{t("egxUnavailable")}</p>
      )}

      {instruments.isError && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage(t, instruments.error)}
        </p>
      )}

      {instruments.isPending && (
        <div className="grid gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      )}

      {instruments.data && instruments.data.data.length === 0 && (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            {t("noResults")}
          </CardContent>
        </Card>
      )}

      {instruments.data && instruments.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("symbol")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("market")}</TableHead>
                <TableHead>{t("currency")}</TableHead>
                <TableHead className="text-end">{t("price")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("dataMode")}</TableHead>
                <TableHead className="text-end">{t("watchlist")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instruments.data.data.map((instrument) => {
                const availability = normalizeAvailability(
                  instrument.availability,
                );
                return (
                  <TableRow key={instrument.id}>
                    <TableCell>
                      <Link
                        href={`/markets/${instrument.id}`}
                        className="font-medium hover:underline"
                      >
                        {instrument.symbol}
                      </Link>
                    </TableCell>
                    <TableCell>{instrument.name}</TableCell>
                    <TableCell>{instrument.market}</TableCell>
                    <TableCell>{instrument.currency}</TableCell>
                    <TableCell className="text-end">
                      <span className="tabular-nums">
                        {instrument.quote
                          ? formatMoney(
                              instrument.quote.price,
                              instrument.currency,
                              locale,
                            )
                          : "—"}
                      </span>
                      {instrument.quote?.stale && (
                        <Badge variant="destructive" className="ms-2">
                          {t("staleQuote")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={availabilityBadgeVariant(availability)}>
                        {t(`availability.${availability}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span>{instrument.data_mode}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t("delay")}: {instrument.delay_seconds}s
                      </span>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={
                          instrument.watched
                            ? t("watchlistRemove")
                            : t("watchlistAdd")
                        }
                        disabled={pendingWatch === instrument.id}
                        onClick={() => toggleWatch(instrument)}
                      >
                        <Star
                          className={
                            instrument.watched
                              ? "fill-current text-amber-500"
                              : "text-muted-foreground"
                          }
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {pagination && pagination.count > 0 && (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                {t("previousPage")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pageOf", { page: pagination.page, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t("nextPage")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
