import { resolveSettingsSection } from "../../_lib/route-guards";
import { OperationsSettings } from "@/features/system-settings/operations";
import {
  OPERATIONS_DEFAULT_SECTION,
  OPERATIONS_SECTION_IDS,
} from "@/features/system-settings/operations/section-registry";

export default async function OperationsSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const section = await resolveSettingsSection(
    params,
    OPERATIONS_SECTION_IDS,
    `/system-settings/operations/${OPERATIONS_DEFAULT_SECTION}`
  );
  return <OperationsSettings sectionId={section} />;
}
