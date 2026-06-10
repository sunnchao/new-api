import { resolveSettingsSection } from "../../_lib/route-guards";
import { ModelSettings } from "@/features/system-settings/models";
import {
  MODELS_DEFAULT_SECTION,
  MODELS_SECTION_IDS,
} from "@/features/system-settings/models/section-registry";

export default async function ModelsSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const section = await resolveSettingsSection(
    params,
    MODELS_SECTION_IDS,
    `/system-settings/models/${MODELS_DEFAULT_SECTION}`
  );
  return <ModelSettings sectionId={section} />;
}
