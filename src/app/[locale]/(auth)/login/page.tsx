import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/features/auth/components/LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div>
      <h2 className="text-lg font-semibold">{t("loginTitle")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("loginSubtitle")}</p>
      <LoginForm />
    </div>
  );
}
