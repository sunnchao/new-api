import { redirect } from "next/navigation";

const CLASSIC_SETTINGS_TAB_ROUTES: Record<string, string> = {
  operation: "/system-settings/operations/behavior",
  dashboard: "/system-settings/content/dashboard",
  chats: "/system-settings/content/chat",
  drawing: "/system-settings/content/drawing",
  payment: "/system-settings/billing/payment",
  ratio: "/system-settings/billing/model-pricing",
  ratelimit: "/system-settings/security/rate-limit",
  models: "/system-settings/models/global",
  "model-deployment": "/system-settings/models/model-deployment",
  performance: "/system-settings/operations/performance",
  system: "/system-settings/auth/basic-auth",
  other: "/system-settings/site/system-info",
};

export default async function ConsoleSettingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await searchParams;
  const rawTab = search.tab;
  const tab = Array.isArray(rawTab) ? rawTab[0] : rawTab;

  redirect(
    CLASSIC_SETTINGS_TAB_ROUTES[tab ?? "operation"] ??
      CLASSIC_SETTINGS_TAB_ROUTES.operation
  );
}
