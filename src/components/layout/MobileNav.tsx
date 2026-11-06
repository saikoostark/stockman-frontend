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
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/features/auth/AuthProvider";

const ITEMS: Array<{ href: string; labelKey: string; action?: string; also?: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/markets", labelKey: "nav.markets", action: "markets.read", icon: TrendingUp },
  { href: "/orders", labelKey: "nav.orders", action: "trading.read", icon: ListChecks },
  { href: "/portfolio", labelKey: "nav.portfolio", action: "trading.read", icon: LineChart },
  { href: "/wallets", labelKey: "nav.wallets", action: "wallets.read", icon: Wallet },
  { href: "/alerts", labelKey: "nav.alerts", action: "alerts.read", icon: Bell },
  { href: "/notifications", labelKey: "nav.notifications", action: "events.read", icon: Bell },
  { href: "/audit", labelKey: "nav.audit", action: "audit.read", icon: FileSearch },
  { href: "/administration", labelKey: "nav.administration", action: "access.manage", also: "catalog.manage", icon: Users },
];

export function MobileNav() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { can } = useAuth();
  const visible = ITEMS.filter((i) => !i.action || can(i.action) || (i.also && can(i.also)));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={locale === "ar" ? "right" : "left"} className="w-64 p-0">
        <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
          <ShieldCheck className="size-5" />
          {t("appName")}
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                pathname.startsWith(`/${item.href.split("/")[1]}`) && "bg-accent",
              )}
            >
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
