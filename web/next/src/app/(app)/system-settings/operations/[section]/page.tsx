import { OperationsSettings } from "@/features/system-settings/operations";

export default async function OperationsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <OperationsSettings sectionId={section} />;
}
