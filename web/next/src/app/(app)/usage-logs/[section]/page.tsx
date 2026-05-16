"use client";

import { UsageLogs } from "@/features/usage-logs";

export default function UsageLogsSectionPage({
  params,
}: {
  params: { section: string };
}) {
  return <UsageLogs section={params.section} />;
}
