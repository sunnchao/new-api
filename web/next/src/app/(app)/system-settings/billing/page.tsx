import { redirect } from "next/navigation";
import { BILLING_DEFAULT_SECTION } from "@/features/system-settings/billing/section-registry";

export default function BillingIndex() {
  redirect(`/system-settings/billing/${BILLING_DEFAULT_SECTION}`);
}
