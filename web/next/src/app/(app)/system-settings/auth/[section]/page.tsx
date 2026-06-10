import { resolveSettingsSection } from "../../_lib/route-guards";
import { AuthSettings } from "@/features/system-settings/auth";
import {
  AUTH_DEFAULT_SECTION,
  AUTH_SECTION_IDS,
} from "@/features/system-settings/auth/section-registry";

export default async function AuthSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const section = await resolveSettingsSection(
    params,
    AUTH_SECTION_IDS,
    `/system-settings/auth/${AUTH_DEFAULT_SECTION}`
  );
  return <AuthSettings sectionId={section} />;
}
