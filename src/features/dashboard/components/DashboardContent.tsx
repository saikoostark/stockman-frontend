"use client";

import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { useNotifications } from "@/features/notifications/api";
import { useOrders, usePortfolio } from "@/features/trading/api";
import { useWallets } from "@/features/wallets/api";
import { formatMoney } from "@/lib/money";

function SectionCard({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          {href ? (
            <Link href={href} className="underline-offset-4 hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export function DashboardContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, can } = useAuth();

  const wallets = useWallets();
  const orders = useOrders(1);
  const portfolio = usePortfolio();
  const notifications = useNotifications(1);

  const openOrders = (orders.data?.data ?? []).filter((o) => o.status === "OPEN");
  const recentNotifications = (notifications.data?.data ?? []).slice(0, 5);

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="pt-4 text-sm text-muted-foreground">
          {t("auth.welcome", { name: user?.username ?? "" })} — {t("status.paperTrading")}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {can("wallets.read") && (
          <SectionCard title={t("nav.wallets")}>
            {wallets.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : (wallets.data ?? []).length === 0 ? (
              <Empty>{t("wallets.noTransactions")}</Empty>
            ) : (
              <dl className="grid gap-3">
                {wallets.data!.map((wallet) => (
                  <div key={wallet.currency} className="flex items-center justify-between gap-2">
                    <dt className="font-medium">{wallet.currency}</dt>
                    <dd className="text-end">
                      <span className="font-medium">
                        {formatMoney(wallet.available, wallet.currency, locale)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t("wallets.reserved")}: {formatMoney(wallet.reserved, wallet.currency, locale)}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionCard>
        )}

        {can("trading.read") && (
          <SectionCard title={t("nav.orders")}>
            {orders.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : openOrders.length === 0 ? (
              <Empty>{t("trading.noOrders")}</Empty>
            ) : (
              <ul className="grid gap-2">
                {openOrders.slice(0, 5).map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-2">
                    <span>
                      {order.symbol} · {order.side === "BUY" ? t("trading.sideBuy") : t("trading.sideSell")}
                    </span>
                    <span className="text-muted-foreground">
                      {order.order_type === "LIMIT"
                        ? `${t("trading.limitPrice")} ${formatMoney(order.limit_price ?? "0", order.currency, locale)}`
                        : t(order.order_type === "MARKET" ? "trading.marketBuy" : "trading.marketSell")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {can("trading.read") && (
          <SectionCard title={t("nav.portfolio")}>
            {portfolio.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : (portfolio.data ?? []).length === 0 ? (
              <Empty>{t("portfolio.noHoldings")}</Empty>
            ) : (
              <dl className="grid gap-3">
                {portfolio.data!.map((bucket) => (
                  <div key={bucket.currency} className="flex items-center justify-between gap-2">
                    <dt className="font-medium">{bucket.currency}</dt>
                    <dd className="text-end text-xs">
                      <span className="block">
                        {t("portfolio.unrealizedPnl")}:{" "}
                        {bucket.unrealized_pnl != null
                          ? formatMoney(bucket.unrealized_pnl, bucket.currency, locale)
                          : "—"}
                      </span>
                      <span className="block text-muted-foreground">
                        {t("portfolio.marketValue")}:{" "}
                        {bucket.market_value != null
                          ? formatMoney(bucket.market_value, bucket.currency, locale)
                          : "—"}
                        {bucket.stale ? ` · ${t("status.stale")}` : ""}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionCard>
        )}

        {can("events.read") && (
          <SectionCard title={t("nav.notifications")} href="/notifications">
            {notifications.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : recentNotifications.length === 0 ? (
              <Empty>{t("notifications.empty")}</Empty>
            ) : (
              <ul className="grid gap-2">
                {recentNotifications.map((notification) => {
                  const params = notification.parameters as Record<string, string | number>;
                  const translated = t(notification.translation_key, params);
                  const message =
                    translated !== notification.translation_key
                      ? translated
                      : t("notifications.default", params);
                  return (
                    <li
                      key={notification.id}
                      className={notification.read_at === null ? "font-medium" : "text-muted-foreground"}
                    >
                      {message}
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
