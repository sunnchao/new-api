import { redirect } from "next/navigation";

import { Dashboard } from "@/features/dashboard";
import {
  DASHBOARD_DEFAULT_SECTION,
  DASHBOARD_SECTION_IDS,
} from "@/features/dashboard/section-registry";

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const { section: rawSection } = await params;
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection;

  if (!section || !(DASHBOARD_SECTION_IDS as readonly string[]).includes(section)) {
    redirect(`/dashboard/${DASHBOARD_DEFAULT_SECTION}`);
  }

  return <Dashboard />;
}
