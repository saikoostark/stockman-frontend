import { getTranslations } from "next-intl/server";

import { AuditPage } from "@/features/audit/components/AuditPage";

export default async function AuditRoutePage() {
  const t = await getTranslations("audit");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      <AuditPage />
    </div>
  );
}
