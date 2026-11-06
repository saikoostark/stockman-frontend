import { getTranslations } from "next-intl/server";

import { InstrumentDetail } from "@/features/markets/components/InstrumentDetail";

export default async function InstrumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("nav");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t("markets")}</h1>
      <InstrumentDetail instrumentId={id} />
    </div>
  );
}
