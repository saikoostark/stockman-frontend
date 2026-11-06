import { getTranslations } from "next-intl/server";

import { DashboardContent } from "@/features/dashboard/components/DashboardContent";

export default async function DashboardPage() {
  const t = await getTranslations("nav");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t("dashboard")}</h1>
      <DashboardContent />
    </div>
  );
}
