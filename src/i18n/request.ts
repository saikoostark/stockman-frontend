import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [core, markets, trading, alerts, admin] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/${locale}.markets.json`),
    import(`../../messages/${locale}.trading.json`),
    import(`../../messages/${locale}.alerts.json`),
    import(`../../messages/${locale}.admin.json`),
  ]);

  return {
    locale,
    messages: {
      ...core.default,
      markets: { ...core.default.markets, ...markets.default.markets },
      trading: { ...core.default.trading, ...trading.default.trading },
      portfolio: { ...core.default.portfolio, ...trading.default.portfolio },
      wallets: { ...core.default.wallets, ...trading.default.wallets },
      alerts: { ...core.default.alerts, ...alerts.default.alerts },
      notifications: { ...core.default.notifications, ...alerts.default.notifications },
      audit: { ...core.default.audit, ...admin.default.audit },
      admin: { ...core.default.admin, ...admin.default.admin },
    },
  };
});
