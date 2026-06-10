import { redirect } from "next/navigation";
import { createUrl } from "@/lib/next-url";
import { USAGE_LOGS_DEFAULT_SECTION } from "@/features/usage-logs/section-registry";

type UsageLogsSearchParams = Record<string, string | string[] | undefined>;

export default async function UsageLogsRootPage({
  searchParams,
}: {
  searchParams: Promise<UsageLogsSearchParams>;
}) {
  const search = await searchParams;
  redirect(createUrl(`/usage-logs/${USAGE_LOGS_DEFAULT_SECTION}`, search));
}
