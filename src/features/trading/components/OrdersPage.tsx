"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { errorMessage } from "@/lib/api/error-message";
import { formatMoney, formatNumber } from "@/lib/money";

import { useCancelOrder, useOrders } from "../api";
import type { Order } from "../types";

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

const STATUS_VARIANTS: Record<
  Order["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  OPEN: "default",
  FILLED: "secondary",
  CANCELLED: "destructive",
  EXPIRED: "outline",
};

function StatusBadge({ status, label }: { status: Order["status"]; label: string }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{label}</Badge>;
}

function orderTypeLabel(
  t: (key: string) => string,
  order: Order,
): string {
  if (order.order_type === "MARKET") {
    return order.side === "BUY" ? t("marketBuy") : t("marketSell");
  }
  return order.side === "BUY" ? t("limitBuy") : t("limitSell");
}

function orderSummary(order: Order, locale: string): string {
  if (order.order_type === "MARKET" && order.side === "BUY" && order.budget !== null) {
    return formatMoney(order.budget, order.currency, locale);
  }
  if (order.quantity !== null && order.limit_price !== null) {
    return `${formatNumber(order.quantity, locale)} @ ${formatMoney(
      order.limit_price,
      order.currency,
      locale,
    )}`;
  }
  if (order.quantity !== null) {
    return formatNumber(order.quantity, locale);
  }
  return "—";
}

function CancelDialog({
  order,
  onOpenChange,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("trading");
  const tg = useTranslations();
  const cancelOrder = useCancelOrder();
  const [serverError, setServerError] = useState<string | null>(null);

  const onConfirm = () => {
    if (!order) return;
    setServerError(null);
    cancelOrder.mutate(
      { order_id: order.id },
      {
        onSuccess: () => {
          toast.success(t("orderCancelled"));
          onOpenChange(false);
        },
        onError: (error) => setServerError(errorMessage(tg, error)),
      },
    );
  };

  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancelOrder")}</DialogTitle>
          <DialogDescription>
            {order !== null && (
              <>
                {order.symbol} — {orderTypeLabel(t, order)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">{t("cancelConfirm")}</p>
        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelOrder.isPending}
          >
            {tg("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={cancelOrder.isPending}
          >
            {t("cancelOrder")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrdersPage() {
  const t = useTranslations("trading");
  const tg = useTranslations();
  const locale = useLocale();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const orders = useOrders(page);

  if (!can("trading.read")) return null;

  if (orders.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (orders.isError) {
    return <p className="text-sm text-destructive">{tg("common.error")}</p>;
  }

  const items = orders.data?.data ?? [];
  const pagination = orders.data?.metadata.pagination;
  const openOrders = items.filter((order) => order.status === "OPEN");
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.count / pagination.page_size))
    : 1;
  const canCancel = can("trading.cancel");

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{t("ordersOpen")}</h2>
        {openOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOpenOrders")}</p>
        ) : (
          <div className="grid gap-3">
            {openOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.symbol}</span>
                      <Badge variant="outline">
                        {order.side === "BUY" ? t("sideBuy") : t("sideSell")}
                      </Badge>
                      <StatusBadge status={order.status} label={t(`status${order.status}`)} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {orderTypeLabel(t, order)} · {orderSummary(order, locale)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("expiresAt")}: {formatDateTime(order.expires_at, locale)}
                    </span>
                  </div>
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelling(order)}
                    >
                      {t("cancelOrder")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{t("ordersHistory")}</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("symbol")}</TableHead>
                <TableHead>{t("side")}</TableHead>
                <TableHead>{t("orderType")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("limitPrice")}</TableHead>
                <TableHead>{t("budget")}</TableHead>
                <TableHead>{t("reservedCash")}</TableHead>
                <TableHead>{t("reservedQuantity")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
                <TableHead>{t("expiresAt")}</TableHead>
                <TableHead>{t("closedAt")}</TableHead>
                <TableHead>{t("closeReason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.side === "BUY" ? t("sideBuy") : t("sideSell")}
                    </Badge>
                  </TableCell>
                  <TableCell>{orderTypeLabel(t, order)}</TableCell>
                  <TableCell>
                    {order.quantity === null
                      ? "—"
                      : formatNumber(order.quantity, locale)}
                  </TableCell>
                  <TableCell>
                    {order.limit_price === null
                      ? "—"
                      : formatMoney(order.limit_price, order.currency, locale)}
                  </TableCell>
                  <TableCell>
                    {order.budget === null
                      ? "—"
                      : formatMoney(order.budget, order.currency, locale)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(order.reserved_cash, order.currency, locale)}
                  </TableCell>
                  <TableCell>
                    {formatNumber(order.reserved_quantity, locale)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} label={t(`status${order.status}`)} />
                  </TableCell>
                  <TableCell>{formatDateTime(order.created_at, locale)}</TableCell>
                  <TableCell>{formatDateTime(order.expires_at, locale)}</TableCell>
                  <TableCell>{formatDateTime(order.closed_at, locale)}</TableCell>
                  <TableCell>{order.close_reason || "—"}</TableCell>
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
              disabled={page <= 1 || orders.isFetching}
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
              disabled={page >= totalPages || orders.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              {t("nextPage")}
            </Button>
          </div>
        )}
      </section>

      <CancelDialog
        order={cancelling}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
      />
    </div>
  );
}
