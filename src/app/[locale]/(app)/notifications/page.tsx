import { getTranslations } from "next-intl/server";

import { NotificationsPage } from "@/features/notifications/components/NotificationsPage";

export default async function NotificationsRoutePage() {
  const t = await getTranslations("notifications");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      <NotificationsPage />
    </div>
  );
}
