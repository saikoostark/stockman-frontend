import { getTranslations } from "next-intl/server";

import { AlertsPage } from "@/features/alerts/components/AlertsPage";

export default async function AlertsRoutePage() {
  const t = await getTranslations("alerts");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      <AlertsPage />
    </div>
  );
}
