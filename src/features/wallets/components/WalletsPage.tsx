"use client";

import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatMoney } from "@/lib/money";

import { useWallets } from "../api";
import type { WalletCurrency } from "../types";
import { FundingDialog, type FundingMode } from "./FundingDialog";
import { LedgerTable } from "./LedgerTable";

export function WalletsPage() {
  const t = useTranslations("wallets");
  const tg = useTranslations();
  const locale = useLocale();
  const { can } = useAuth();
  const wallets = useWallets();
  const [funding, setFunding] = useState<{
    currency: WalletCurrency;
    mode: FundingMode;
  } | null>(null);
  const [ledgerCurrency, setLedgerCurrency] = useState<string | null>(null);

  if (!can("wallets.read")) return null;

  if (wallets.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }
  if (wallets.isError) {
    return <p className="text-sm text-destructive">{tg("common.error")}</p>;
  }

  const list = wallets.data ?? [];
  const activeLedger = ledgerCurrency ?? list[0]?.currency ?? null;
  const canFund = can("wallets.fund");

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noWallets")}</p>
        )}
        {list.map((wallet) => {
          const total = new Decimal(wallet.available)
            .plus(wallet.reserved)
            .toFixed();
          return (
            <Card key={wallet.currency}>
              <CardHeader>
                <CardTitle>{wallet.currency}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">{t("available")}</span>
                  <span className="font-medium">
                    {formatMoney(wallet.available, wallet.currency, locale)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">{t("reserved")}</span>
                  <span>{formatMoney(wallet.reserved, wallet.currency, locale)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t pt-2">
                  <span className="text-muted-foreground">{t("total")}</span>
                  <span className="font-semibold">
                    {formatMoney(total, wallet.currency, locale)}
                  </span>
                </div>
                {canFund && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setFunding({ currency: wallet.currency, mode: "topup" })
                      }
                    >
                      {t("topup")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFunding({ currency: wallet.currency, mode: "withdraw" })
                      }
                    >
                      {t("withdraw")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{t("ledger")}</h2>
        {activeLedger === null ? (
          <p className="text-sm text-muted-foreground">{t("noTransactions")}</p>
        ) : (
          <Tabs value={activeLedger} onValueChange={setLedgerCurrency}>
            <TabsList>
              {list.map((wallet) => (
                <TabsTrigger key={wallet.currency} value={wallet.currency}>
                  {wallet.currency}
                </TabsTrigger>
              ))}
            </TabsList>
            {list.map((wallet) => (
              <TabsContent key={wallet.currency} value={wallet.currency}>
                <LedgerTable currency={wallet.currency} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>

      <FundingDialog
        open={funding !== null}
        onOpenChange={(open) => {
          if (!open) setFunding(null);
        }}
        currency={funding?.currency ?? "EGP"}
        mode={funding?.mode ?? "topup"}
      />
    </div>
  );
}
