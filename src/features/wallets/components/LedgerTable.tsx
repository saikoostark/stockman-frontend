"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api/error-message";
import { formatMoney } from "@/lib/money";

import { useLedger, useReverseJournal } from "../api";
import type { Journal } from "../types";

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function translateKey(t: (key: string) => string, key: string): string {
  const label = t(key);
  return label === key ? key : label;
}

function ReversalDialog({
  journal,
  currency,
  onOpenChange,
}: {
  journal: Journal | null;
  currency: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("wallets");
  const tg = useTranslations();
  const reverse = useReverseJournal();
  const [reason, setReason] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!journal) return;
    setServerError(null);
    reverse.mutate(
      { id: journal.id, currency, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("reversalSuccess"));
          setReason("");
          onOpenChange(false);
        },
        onError: (error) => setServerError(errorMessage(tg, error)),
      },
    );
  };

  return (
    <Dialog open={journal !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("reverseTitle")}</DialogTitle>
          <DialogDescription>{t("reverseConfirm")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="reversal-reason">{t("reversalReason")}</Label>
            <Textarea
              id="reversal-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
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
              disabled={reverse.isPending}
            >
              {tg("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={reverse.isPending || reason.trim().length === 0}
            >
              {t("reverse")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LedgerTable({ currency }: { currency: string }) {
  const t = useTranslations("wallets");
  const tg = useTranslations();
  const locale = useLocale();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [reversing, setReversing] = useState<Journal | null>(null);
  const ledger = useLedger(currency, page);

  if (ledger.isPending) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (ledger.isError) {
    return <p className="text-sm text-destructive">{tg("common.error")}</p>;
  }

  const items = ledger.data?.data ?? [];
  const pagination = ledger.data?.metadata.pagination;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.count / pagination.page_size))
    : 1;

  return (
    <div className="grid gap-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTransactions")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("journal")}</TableHead>
              <TableHead>{t("reference")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead>{t("entries")}</TableHead>
              <TableHead>{t("createdAt")}</TableHead>
              <TableHead>{t("postedAt")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((journal) => (
              <TableRow key={journal.id}>
                <TableCell>
                  {translateKey(t, `kind${journal.kind}`)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {journal.reference}
                </TableCell>
                <TableCell className="max-w-64 truncate">
                  {journal.reason || "—"}
                </TableCell>
                <TableCell>
                  <ul className="grid gap-0.5 text-xs">
                    {journal.entries.map((entry, index) => (
                      <li key={index}>
                        {translateKey(t, `account${entry.account}`)}
                        {": "}
                        {formatMoney(entry.amount, journal.currency, locale)}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>{formatDateTime(journal.created_at, locale)}</TableCell>
                <TableCell>{formatDateTime(journal.posted_at, locale)}</TableCell>
                <TableCell>
                  {can("wallets.fund") && journal.reversal_of === null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReversing(journal)}
                    >
                      {t("reverse")}
                    </Button>
                  )}
                </TableCell>
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
            disabled={page <= 1 || ledger.isFetching}
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
            disabled={page >= totalPages || ledger.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("nextPage")}
          </Button>
        </div>
      )}
      <ReversalDialog
        journal={reversing}
        currency={currency}
        onOpenChange={(open) => {
          if (!open) setReversing(null);
        }}
      />
    </div>
  );
}
