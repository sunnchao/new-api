"use client";

import { Dashboard } from "@/features/dashboard";

export default function DashboardSectionPage({
  params,
}: {
  params: { section: string };
}) {
  return <Dashboard section={params.section} />;
}
