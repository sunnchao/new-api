import { ModelSettings } from "@/features/system-settings/models";

export default async function ModelsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <ModelSettings sectionId={section} />;
}
