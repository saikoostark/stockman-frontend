import { getTranslations } from "next-intl/server";

import { GroupsPage } from "@/features/administration/components/GroupsPage";
import { UsersPage } from "@/features/administration/components/UsersPage";

export default async function AdministrationPage() {
  const t = await getTranslations("admin");
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
        <GroupsPage />
      </div>
      <UsersPage />
    </div>
  );
}
