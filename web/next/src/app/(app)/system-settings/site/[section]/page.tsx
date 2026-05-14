import { SiteSettings } from "@/features/system-settings/site";

export default async function SiteSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <SiteSettings sectionId={section} />;
}
