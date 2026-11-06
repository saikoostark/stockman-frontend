"use client";

import {
  Bell,
  FileSearch,
  LayoutDashboard,
  LineChart,
  ListChecks,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/features/auth/AuthProvider";

interface NavItem {
  href: string;
  labelKey: string;
  action?: string;
  also?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/markets", labelKey: "nav.markets", action: "markets.read", icon: TrendingUp },
  { href: "/orders", labelKey: "nav.orders", action: "trading.read", icon: ListChecks },
  { href: "/portfolio", labelKey: "nav.portfolio", action: "trading.read", icon: LineChart },
  { href: "/wallets", labelKey: "nav.wallets", action: "wallets.read", icon: Wallet },
  { href: "/alerts", labelKey: "nav.alerts", action: "alerts.read", icon: Bell },
  { href: "/notifications", labelKey: "nav.notifications", action: "events.read", icon: Bell },
  { href: "/audit", labelKey: "nav.audit", action: "audit.read", icon: FileSearch },
  {
    href: "/administration",
    labelKey: "nav.administration",
    action: "access.manage",
    icon: Users,
    also: "catalog.manage",
  },
];

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const { can } = useAuth();

  const visible = NAV_ITEMS.filter(
    (item) => !item.action || can(item.action) || (item.also && can(item.also)),
  );

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <ShieldCheck className="size-5" />
        {t("appName")}
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {visible.map((item) => {
          const active =
            pathname.startsWith(`/${item.href.split("/")[1]}`) ||
            (item.href === "/dashboard" && pathname.endsWith("/dashboard"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
