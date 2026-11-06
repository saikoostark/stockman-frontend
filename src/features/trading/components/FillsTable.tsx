"use client";

import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { useFills } from "../api";

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function FillsTable() {
  const t = useTranslations("trading");
  const tg = useTranslations();
  const locale = useLocale();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const fills = useFills(page);

  if (!can("trading.read")) return null;

  if (fills.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (fills.isError) {
    return <p className="text-sm text-destructive">{tg("common.error")}</p>;
  }

  const items = fills.data?.data ?? [];
  const pagination = fills.data?.metadata.pagination;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.count / pagination.page_size))
    : 1;

  return (
    <div className="grid gap-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noFills")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("symbol")}</TableHead>
              <TableHead>{t("side")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("cash")}</TableHead>
              <TableHead>{t("costBasis")}</TableHead>
              <TableHead>{t("realizedPnl")}</TableHead>
              <TableHead>{t("fees")}</TableHead>
              <TableHead>{t("sourceAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((fill) => (
              <TableRow key={fill.id}>
                <TableCell className="font-medium">{fill.symbol}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {fill.side === "BUY" ? t("sideBuy") : t("sideSell")}
                  </Badge>
                </TableCell>
                <TableCell>{formatNumber(fill.quantity, locale)}</TableCell>
                <TableCell>{formatMoney(fill.price, fill.currency, locale)}</TableCell>
                <TableCell>{formatMoney(fill.cash, fill.currency, locale)}</TableCell>
                <TableCell>
                  {formatMoney(fill.cost_basis, fill.currency, locale)}
                </TableCell>
                <TableCell
                  className={
                    new Decimal(fill.realized_pnl).isPositive()
                      ? "text-emerald-600 dark:text-emerald-400"
                      : new Decimal(fill.realized_pnl).isNegative()
                        ? "text-destructive"
                        : ""
                  }
                >
                  {formatMoney(fill.realized_pnl, fill.currency, locale)}
                </TableCell>
                <TableCell>{formatMoney(fill.fees, fill.currency, locale)}</TableCell>
                <TableCell>{formatDateTime(fill.source_at, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || fills.isFetching}
            onClick={() => setPage((current) => current - 1)}
          >
            {t("prevPage")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pageInfo", { page: pagination.page, pages: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || fills.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("nextPage")}
          </Button>
        </div>
      )}
    </div>
  );
}
