"use client";

import { Check, Languages } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useSetLocale } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthProvider";

const LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
  es: "Español",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const setLocale = useSetLocale();

  const switchTo = (next: string) => {
    router.replace(pathname, { locale: next as (typeof routing.locales)[number] });
    if (isAuthenticated) setLocale.mutate(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Language">
          <Languages className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((item) => (
          <DropdownMenuItem
            key={item}
            onSelect={() => switchTo(item)}
            className="justify-between"
          >
            {LABELS[item]}
            {item === locale && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
