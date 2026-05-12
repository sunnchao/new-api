import { ModelDetailsPage } from "@/features/pricing";

export default async function Page({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  return <ModelDetailsPage modelId={modelId} />;
}
