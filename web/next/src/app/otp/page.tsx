import { Suspense } from "react";
import { OtpPage } from "@/features/auth/otp";

export default function Page() {
  return (
    <Suspense>
      <OtpPage />
    </Suspense>
  );
}
