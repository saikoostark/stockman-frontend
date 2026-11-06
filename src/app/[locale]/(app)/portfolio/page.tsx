import { getTranslations } from "next-intl/server";

import { PortfolioPage } from "@/features/trading/components/PortfolioPage";

export default async function PortfolioRoute() {
  const t = await getTranslations("portfolio");
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <PortfolioPage />
    </div>
  );
}
