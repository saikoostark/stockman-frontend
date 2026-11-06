import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations();
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex items-center justify-end gap-1 p-4">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <ShieldCheck className="size-8 text-primary" />
            <h1 className="text-xl font-semibold">{t("appName")}</h1>
            <p className="text-xs text-muted-foreground">{t("status.paperTrading")}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
