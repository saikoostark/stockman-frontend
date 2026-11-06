import { getTranslations } from "next-intl/server";

import { InstrumentsList } from "@/features/markets/components/InstrumentsList";
import { ProviderStatus } from "@/features/markets/components/ProviderStatus";

export default async function MarketsPage() {
  const t = await getTranslations("nav");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t("markets")}</h1>
      <div className="grid gap-6">
        <InstrumentsList />
        <ProviderStatus />
      </div>
    </div>
  );
}
