"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api/error-message";

import { useMarkRead, useNotifications } from "../api";
import type { Notification } from "../types";

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationRow({ notification }: { notification: Notification }) {
  const t = useTranslations();
  const tn = useTranslations("notifications");
  const locale = useLocale();
  const markRead = useMarkRead(notification.id);

  const params = notification.parameters as Record<string, string | number>;
  const translated = t(notification.translation_key, params);
  // Missing key: t() returns the raw key. Fall back to a generic style rather
  // than showing a frozen English string.
  const fallback = t("notifications.default", params);
  const message =
    translated !== notification.translation_key
      ? translated
      : fallback !== "notifications.default"
        ? fallback
        : notification.translation_key;

  const unread = notification.read_at === null;

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3 last:border-b-0 ${
        unread ? "bg-accent/40" : ""
      }`}
    >
      <div className="grid gap-1 text-sm">
        <p className={unread ? "font-medium" : "text-muted-foreground"}>{message}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(notification.created_at, locale)}</p>
      </div>
      <div className="flex items-center gap-2">
        {unread && <Badge>{tn("unread")}</Badge>}
        <Button
          variant="outline"
          size="sm"
          disabled={!unread || markRead.isPending}
          onClick={() => markRead.mutate(undefined, { onError: (error) => toast.error(errorMessage(t, error)) })}
        >
          {tn("markRead")}
        </Button>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const t = useTranslations();
  const tn = useTranslations("notifications");
  const tc = useTranslations("common");
  const { can } = useAuth();

  const [page, setPage] = useState(1);
  const notificationsQuery = useNotifications(page);

  if (!can("events.read")) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t("errors.permission_denied")}</AlertTitle>
      </Alert>
    );
  }

  const notifications = notificationsQuery.data?.data ?? [];
  const pagination = notificationsQuery.data?.metadata.pagination;
  const pageCount = pagination ? Math.max(1, Math.ceil(pagination.count / pagination.page_size)) : 1;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {tn("prev")}
        </Button>
        <p className="text-sm text-muted-foreground">{tn("pageOf", { page, pages: pageCount })}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        >
          {tn("next")}
        </Button>
      </div>

      <Card>
        <CardContent>
          {notificationsQuery.isPending ? (
            <div className="grid gap-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : notificationsQuery.isError ? (
            <div className="grid gap-2 py-4 text-sm text-muted-foreground">
              <p role="alert">{errorMessage(t, notificationsQuery.error)}</p>
              <div>
                <Button variant="outline" size="sm" onClick={() => notificationsQuery.refetch()}>
                  {tc("retry")}
                </Button>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{tn("empty")}</p>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
