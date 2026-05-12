import { Suspense } from "react";
import { SignInPage } from "@/features/auth/sign-in";

export default function Page() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
