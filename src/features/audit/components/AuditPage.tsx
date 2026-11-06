"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PaginationBar } from "@/components/pagination-bar";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api/error-message";

import { useAudit, type AuditFilters } from "../api";

export function AuditPage() {
  const t = useTranslations("audit");
  const tc = useTranslations("common");
  const tGlobal = useTranslations();
  const locale = useLocale();
  const { can, capabilities } = useAuth();

  const [draft, setDraft] = useState<AuditFilters>({ action: "", target_type: "" });
  const [filters, setFilters] = useState<AuditFilters>({ action: "", target_type: "" });
  const [page, setPage] = useState(1);

  const allowed = can("audit.read");
  const query = useAudit(filters, page, allowed);

  if (!capabilities) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">{tGlobal("errors.permission_denied")}</p>
    );
  }

  const timeFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  const pagination = query.data?.metadata.pagination;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.count / pagination.page_size)) : 1;

  return (
    <div className="grid gap-3">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters(draft);
        }}
      >
        <div className="grid min-w-44 flex-1 gap-1.5">
          <Label htmlFor="audit-action" className="text-xs text-muted-foreground">
            {t("action")}
          </Label>
          <Input
            id="audit-action"
            value={draft.action}
            onChange={(event) => setDraft((d) => ({ ...d, action: event.target.value }))}
            placeholder={t("actionPlaceholder")}
          />
        </div>
        <div className="grid min-w-44 flex-1 gap-1.5">
          <Label htmlFor="audit-target-type" className="text-xs text-muted-foreground">
            {t("targetType")}
          </Label>
          <Input
            id="audit-target-type"
            value={draft.target_type}
            onChange={(event) => setDraft((d) => ({ ...d, target_type: event.target.value }))}
            placeholder={t("targetTypePlaceholder")}
          />
        </div>
        <Button type="submit" variant="outline">
          {tc("search")}
        </Button>
      </form>

      {query.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage(tGlobal, query.error)}
        </p>
      ) : query.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("time")}</TableHead>
                <TableHead>{t("actor")}</TableHead>
                <TableHead>{t("action")}</TableHead>
                <TableHead>{t("targetType")}</TableHead>
                <TableHead>{t("targetId")}</TableHead>
                <TableHead>{t("reason")}</TableHead>
                <TableHead>{t("changes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data?.data ?? []).map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{timeFormat.format(new Date(event.created_at))}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.actor_id == null ? t("system") : String(event.actor_id)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{event.action}</TableCell>
                  <TableCell className="font-mono text-xs">{event.target_type}</TableCell>
                  <TableCell className="max-w-40 truncate font-mono text-xs">
                    {event.target_id ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-56 truncate">{event.reason || "—"}</TableCell>
                  <TableCell>
                    <pre className="max-h-24 max-w-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-1.5 font-mono text-[11px] leading-snug">
                      {event.changes == null ? "—" : JSON.stringify(event.changes)}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
              {(query.data?.data.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pagination && pagination.count > 0 && (
            <PaginationBar
              label={t("pageXofY", { page: pagination.page, pages: totalPages })}
              prevLabel={t("previous")}
              nextLabel={t("next")}
              canPrev={page > 1}
              canNext={page < totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}
