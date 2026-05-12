import { ProviderOAuthPage } from "@/features/auth/oauth-callback";

export default async function Page({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  return <ProviderOAuthPage provider={provider} />;
}
