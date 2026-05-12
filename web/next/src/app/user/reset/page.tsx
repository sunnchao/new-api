import { ResetPasswordConfirm } from "@/features/auth/reset-password-confirm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;
  return <ResetPasswordConfirm email={email} token={token} />;
}
