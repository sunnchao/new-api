import { ContentSettings } from "@/features/system-settings/content";

export default async function ContentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <ContentSettings sectionId={section} />;
}
