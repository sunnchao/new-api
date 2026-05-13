import UsageLogsPage from "@/features/usage-logs";

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <UsageLogsPage section={section} />;
}
