import { redirect } from "next/navigation";
import { SITE_DEFAULT_SECTION } from "@/features/system-settings/site/section-registry";
import { AUTH_DEFAULT_SECTION } from "@/features/system-settings/auth/section-registry";
import { BILLING_DEFAULT_SECTION } from "@/features/system-settings/billing/section-registry";
import { MODELS_DEFAULT_SECTION } from "@/features/system-settings/models/section-registry";
import { SECURITY_DEFAULT_SECTION } from "@/features/system-settings/security/section-registry";
import { CONTENT_DEFAULT_SECTION } from "@/features/system-settings/content/section-registry";
import { OPERATIONS_DEFAULT_SECTION } from "@/features/system-settings/operations/section-registry";

const CATEGORY_DEFAULTS: Record<string, string> = {
  site: SITE_DEFAULT_SECTION,
  auth: AUTH_DEFAULT_SECTION,
  billing: BILLING_DEFAULT_SECTION,
  models: MODELS_DEFAULT_SECTION,
  security: SECURITY_DEFAULT_SECTION,
  content: CONTENT_DEFAULT_SECTION,
  operations: OPERATIONS_DEFAULT_SECTION,
};

export default async function SystemSettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const defaultSection = CATEGORY_DEFAULTS[section];
  if (defaultSection) {
    redirect(`/system-settings/${section}/${defaultSection}`);
  }
  redirect(`/system-settings/site/${SITE_DEFAULT_SECTION}`);
}
