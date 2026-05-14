import { AuthSettings } from "@/features/system-settings/auth";

export default async function AuthSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <AuthSettings sectionId={section} />;
}
