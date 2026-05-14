import { SecuritySettings } from "@/features/system-settings/security";

export default async function SecuritySectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <SecuritySettings sectionId={section} />;
}
