"use client";

import { GeneralErrorPage } from "@/features/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GeneralErrorPage error={error} reset={reset} />;
}
