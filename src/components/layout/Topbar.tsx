"use client";

import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  const t = useTranslations();
  const router = useRouter();
  const logout = useLogout();
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <MobileNav />
      <div className="flex items-center gap-2 font-semibold md:hidden">
        <ShieldCheck className="size-5" />
        {t("appName")}
      </div>
      <div className="ms-auto flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("nav.profile")}>
              <UserIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                logout.mutate(undefined, {
                  onSuccess: () => {
                    router.replace("/login");
                    router.refresh();
                  },
                });
              }}
            >
              <LogOut className="size-4" />
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
