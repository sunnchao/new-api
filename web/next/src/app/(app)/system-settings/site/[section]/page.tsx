import { resolveSettingsSection } from "../../_lib/route-guards";
import { SiteSettings } from "@/features/system-settings/site";
import {
  SITE_DEFAULT_SECTION,
  SITE_SECTION_IDS,
} from "@/features/system-settings/site/section-registry";

export default async function SiteSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const section = await resolveSettingsSection(
    params,
    SITE_SECTION_IDS,
    `/system-settings/site/${SITE_DEFAULT_SECTION}`
  );
  return <SiteSettings sectionId={section} />;
}
