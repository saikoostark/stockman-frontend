"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
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
import { formatMoney, formatNumber } from "@/lib/money/format";

import { useAlerts, useDeleteAlert, useUpdateAlert } from "../api";
import type { Alert as AlertItem } from "../types";
import { AlertForm } from "./AlertForm";

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatThreshold(alert: AlertItem, locale: string): string {
  if (alert.kind === "PRICE_ABOVE" || alert.kind === "PRICE_BELOW") {
    return `${formatMoney(alert.threshold, alert.currency, locale)} ${alert.currency}`;
  }
  return `${formatNumber(alert.threshold, locale)}%`;
}

function EnabledSwitch({ alert }: { alert: AlertItem }) {
  const t = useTranslations();
  const { can } = useAuth();
  const update = useUpdateAlert(alert.id);

  return (
    <Switch
      checked={alert.enabled}
      disabled={!can("alerts.manage") || update.isPending}
      aria-label={t("alerts.enabled")}
      onCheckedChange={(checked) =>
        update.mutate({ enabled: checked }, { onError: (error) => toast.error(errorMessage(t, error)) })
      }
    />
  );
}

export function AlertsPage() {
  const t = useTranslations("alerts");
  const tc = useTranslations("common");
  const tGlobal = useTranslations();
  const locale = useLocale();
  const { can } = useAuth();

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AlertItem | null>(null);
  const [deleting, setDeleting] = useState<AlertItem | null>(null);

  const alertsQuery = useAlerts(page);
  const deleteAlert = useDeleteAlert(deleting?.id ?? "");

  if (!can("alerts.read")) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{tGlobal("errors.permission_denied")}</AlertTitle>
      </Alert>
    );
  }

  const alerts = alertsQuery.data?.data ?? [];
  const pagination = alertsQuery.data?.metadata.pagination;
  const pageCount = pagination ? Math.max(1, Math.ceil(pagination.count / pagination.page_size)) : 1;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (alert: AlertItem) => {
    setEditing(alert);
    setFormOpen(true);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    deleteAlert.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("deleted"));
        setDeleting(null);
      },
      onError: (error) => toast.error(errorMessage(tGlobal, error)),
    });
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {t("prev")}
        </Button>
        <p className="text-sm text-muted-foreground">{t("pageOf", { page, pages: pageCount })}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        >
          {t("next")}
        </Button>
        {can("alerts.manage") && <Button onClick={openCreate}>{t("create")}</Button>}
      </div>

      <Card>
        <CardContent>
          {alertsQuery.isPending ? (
            <div className="grid gap-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : alertsQuery.isError ? (
            <div className="grid gap-2 py-4 text-sm text-muted-foreground">
              <p role="alert">{errorMessage(tGlobal, alertsQuery.error)}</p>
              <div>
                <Button variant="outline" size="sm" onClick={() => alertsQuery.refetch()}>
                  {tc("retry")}
                </Button>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{t("noAlerts")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("instrument")}</TableHead>
                  <TableHead>{t("kind")}</TableHead>
                  <TableHead>{t("threshold")}</TableHead>
                  <TableHead>{t("window")}</TableHead>
                  <TableHead>{t("cooldown")}</TableHead>
                  <TableHead>{t("enabled")}</TableHead>
                  <TableHead>{t("stateReason")}</TableHead>
                  <TableHead>{t("baselineAt")}</TableHead>
                  <TableHead>{t("lastTriggeredAt")}</TableHead>
                  {can("alerts.manage") && <TableHead>{tc("actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.symbol}</TableCell>
                    <TableCell>{t(`kind${alert.kind}`)}</TableCell>
                    <TableCell>{formatThreshold(alert, locale)}</TableCell>
                    <TableCell>{alert.window_seconds ?? "—"}</TableCell>
                    <TableCell>{alert.cooldown_seconds}</TableCell>
                    <TableCell>
                      <EnabledSwitch alert={alert} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{alert.state_reason}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(alert.baseline_at, locale)}</TableCell>
                    <TableCell>{formatDateTime(alert.last_triggered_at, locale)}</TableCell>
                    {can("alerts.manage") && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(alert)}>
                            {t("edit")}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleting(alert)}>
                            {tc("delete")}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Keyed so the form remounts with fresh defaults each time it opens. */}
      {can("alerts.manage") && (
        <AlertForm
          key={`${formOpen}-${editing?.id ?? "new"}`}
          open={formOpen}
          onOpenChange={setFormOpen}
          alert={editing}
        />
      )}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {deleting ? `${deleting.symbol} — ${t(`kind${deleting.kind}`)}` : ""}
              {t("deleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {tc("cancel")}
            </Button>
            <Button variant="destructive" disabled={deleteAlert.isPending} onClick={confirmDelete}>
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
