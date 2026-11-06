import { getTranslations } from "next-intl/server";

import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  return (
    <div>
      <h2 className="text-lg font-semibold">{t("registerTitle")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("registerSubtitle")}</p>
      <RegisterForm />
    </div>
  );
}
