import { resolveSettingsSection } from "../../_lib/route-guards";
import { BillingSettings } from "@/features/system-settings/billing";
import {
  BILLING_DEFAULT_SECTION,
  BILLING_SECTION_IDS,
} from "@/features/system-settings/billing/section-registry";

export default async function BillingSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const section = await resolveSettingsSection(
    params,
    BILLING_SECTION_IDS,
    `/system-settings/billing/${BILLING_DEFAULT_SECTION}`
  );
  return <BillingSettings sectionId={section} />;
}
