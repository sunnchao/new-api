import DashboardSectionPage from "@/features/dashboard/section-page";

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <DashboardSectionPage section={section} />;
}
