import { getTranslations } from "next-intl/server";

import { FillsTable } from "@/features/trading/components/FillsTable";
import { OrdersPage } from "@/features/trading/components/OrdersPage";

export default async function OrdersRoute() {
  const t = await getTranslations("trading");
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <OrdersPage />
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{t("fills")}</h2>
        <FillsTable />
      </section>
    </div>
  );
}
