import { redirect } from "next/navigation";
import { createUrl } from "@/lib/next-url";

type ConsoleLogSearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ConsoleLogSearchParams>;
}) {
  const search = await searchParams;
  redirect(createUrl("/usage-logs", search));
}
