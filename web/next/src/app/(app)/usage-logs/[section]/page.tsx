import { redirect } from "next/navigation";
import { createUrl } from "@/lib/next-url";
import { UsageLogs } from "@/features/usage-logs";
import {
  isUsageLogsSectionId,
  USAGE_LOGS_DEFAULT_SECTION,
} from "@/features/usage-logs/section-registry";

type UsageLogsSectionParams = {
  section?: string | string[];
};

type UsageLogsSearchParams = Record<string, string | string[] | undefined>;

export default async function UsageLogsSectionPage({
  params,
  searchParams,
}: {
  params: Promise<UsageLogsSectionParams>;
  searchParams: Promise<UsageLogsSearchParams>;
}) {
  const { section: rawSection } = await params;
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection;
  const search = await searchParams;

  if (!section || !isUsageLogsSectionId(section)) {
    redirect(createUrl(`/usage-logs/${USAGE_LOGS_DEFAULT_SECTION}`, search));
  }

  const hasTypeSearch = Array.isArray(search.type)
    ? search.type.length > 0
    : search.type != null && search.type !== "";
  if (section !== "common" && hasTypeSearch) {
    const { type: _type, ...cleanSearch } = search;
    redirect(createUrl(`/usage-logs/${section}`, cleanSearch));
  }

  return <UsageLogs />;
}
