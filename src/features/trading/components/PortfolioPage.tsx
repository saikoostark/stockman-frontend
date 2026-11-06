"use client";

import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatMoney, formatNumber } from "@/lib/money";

import { usePortfolio } from "../api";

const DASH = "—";

export function PortfolioPage() {
  const t = useTranslations("portfolio");
  const tg = useTranslations();
  const locale = useLocale();
  const { can } = useAuth();
  const portfolio = usePortfolio();

  if (!can("trading.read")) return null;

  if (portfolio.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (portfolio.isError) {
    return <p className="text-sm text-destructive">{tg("common.error")}</p>;
  }

  const currencies = portfolio.data ?? [];
  if (currencies.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noPositions")}</p>;
  }

  return (
    <div className="grid gap-6">
      {currencies.map((item) => (
        <section key={item.currency} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {item.currency}
                  {item.stale && <Badge variant="outline">{t("stale")}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">{t("realizedPnl")}</span>
                  <span
                    className={
                      new Decimal(item.realized_pnl).isPositive()
                        ? "font-medium text-emerald-600 dark:text-emerald-400"
                        : new Decimal(item.realized_pnl).isNegative()
                          ? "font-medium text-destructive"
                          : "font-medium"
                    }
                  >
                    {formatMoney(item.realized_pnl, item.currency, locale)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("unrealizedPnl")}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="font-medium">
                  {item.unrealized_pnl === null
                    ? DASH
                    : formatMoney(item.unrealized_pnl, item.currency, locale)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("marketValue")}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="font-medium">
                  {item.market_value === null
                    ? DASH
                    : formatMoney(item.market_value, item.currency, locale)}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("holdings")} · {item.currency}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.holdings.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noHoldings")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("symbol")}</TableHead>
                      <TableHead>{t("available")}</TableHead>
                      <TableHead>{t("reserved")}</TableHead>
                      <TableHead>{t("costBasis")}</TableHead>
                      <TableHead>{t("markPrice")}</TableHead>
                      <TableHead>{t("marketValue")}</TableHead>
                      <TableHead>{t("unrealizedPnl")}</TableHead>
                      <TableHead>{t("stale")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.holdings.map((holding) => (
                      <TableRow key={holding.instrument_id}>
                        <TableCell className="font-medium">{holding.symbol}</TableCell>
                        <TableCell>{formatNumber(holding.available, locale)}</TableCell>
                        <TableCell>{formatNumber(holding.reserved, locale)}</TableCell>
                        <TableCell>
                          {formatMoney(holding.cost_basis, holding.currency, locale)}
                        </TableCell>
                        <TableCell>
                          {holding.mark_price === null
                            ? DASH
                            : formatNumber(holding.mark_price, locale)}
                        </TableCell>
                        <TableCell>
                          {holding.market_value === null
                            ? DASH
                            : formatMoney(holding.market_value, holding.currency, locale)}
                        </TableCell>
                        <TableCell>
                          {holding.unrealized_pnl === null
                            ? DASH
                            : formatMoney(holding.unrealized_pnl, holding.currency, locale)}
                        </TableCell>
                        <TableCell>
                          {holding.stale ? (
                            <Badge variant="outline">{t("stale")}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
