"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { useProviders } from "../api";
import { availabilityBadgeVariant, normalizeAvailability } from "../availability";

export function ProviderStatus() {
  const t = useTranslations("markets");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { can } = useAuth();
  const canRead = can("markets.read");

  const providers = useProviders(canRead);

  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  if (!canRead) return null;

  const formatDate = (value: string | null) =>
    value ? dateTime.format(new Date(value)) : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("providerStatus")}</CardTitle>
      </CardHeader>
      <CardContent>
        {providers.isError && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage(t, providers.error)}
          </p>
        )}
        {providers.isPending && (
          <p className="text-sm text-muted-foreground">{tc("loading")}</p>
        )}
        {providers.data && providers.data.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noProviders")}</p>
        )}
        {providers.data && providers.data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("provider")}</TableHead>
                <TableHead>{t("market")}</TableHead>
                <TableHead>{t("currency")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("message")}</TableHead>
                <TableHead>{t("entitlementVerified")}</TableHead>
                <TableHead>{t("delay")}</TableHead>
                <TableHead>{t("cadence")}</TableHead>
                <TableHead>{t("historyLimit")}</TableHead>
                <TableHead>{t("lastSuccessAt")}</TableHead>
                <TableHead>{t("retryAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.data.map((provider) => {
                const status = normalizeAvailability(provider.status);
                return (
                  <TableRow key={`${provider.provider}-${provider.market}`}>
                    <TableCell className="font-medium">
                      {provider.provider}
                    </TableCell>
                    <TableCell>{provider.market}</TableCell>
                    <TableCell>{provider.currency}</TableCell>
                    <TableCell>
                      <Badge variant={availabilityBadgeVariant(status)}>
                        {t(`availability.${status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal">
                      <p>{provider.reason || "—"}</p>
                      {provider.message && (
                        <p className="text-muted-foreground">
                          {provider.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.entitlement_verified ? tc("yes") : tc("no")}
                    </TableCell>
                    <TableCell>{provider.delay_seconds}s</TableCell>
                    <TableCell>{provider.cadence_seconds}s</TableCell>
                    <TableCell>{provider.history_limit}</TableCell>
                    <TableCell>{formatDate(provider.last_success_at)}</TableCell>
                    <TableCell>{formatDate(provider.retry_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
