import { getTranslations } from "next-intl/server";

import { WalletsPage } from "@/features/wallets/components/WalletsPage";

export default async function WalletsRoute() {
  const t = await getTranslations("wallets");
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <WalletsPage />
    </div>
  );
}
