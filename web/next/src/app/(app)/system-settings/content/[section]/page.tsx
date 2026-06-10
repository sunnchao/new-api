import { resolveSettingsSection } from "../../_lib/route-guards";
import { ContentSettings } from "@/features/system-settings/content";
import {
  CONTENT_DEFAULT_SECTION,
  CONTENT_SECTION_IDS,
} from "@/features/system-settings/content/section-registry";

export default async function ContentSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const section = await resolveSettingsSection(
    params,
    CONTENT_SECTION_IDS,
    `/system-settings/content/${CONTENT_DEFAULT_SECTION}`
  );
  return <ContentSettings sectionId={section} />;
}
