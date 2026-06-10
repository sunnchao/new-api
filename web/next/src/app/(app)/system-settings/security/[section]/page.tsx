import { resolveSettingsSection } from "../../_lib/route-guards";
import { SecuritySettings } from "@/features/system-settings/security";
import {
  SECURITY_DEFAULT_SECTION,
  SECURITY_SECTION_IDS,
} from "@/features/system-settings/security/section-registry";

export default async function SecuritySectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const section = await resolveSettingsSection(
    params,
    SECURITY_SECTION_IDS,
    `/system-settings/security/${SECURITY_DEFAULT_SECTION}`
  );
  return <SecuritySettings sectionId={section} />;
}
