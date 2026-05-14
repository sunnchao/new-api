import { BillingSettings } from "@/features/system-settings/billing";

export default async function BillingSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <BillingSettings sectionId={section} />;
}
