"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export function GeneralErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-8xl font-bold text-[var(--destructive)]">500</span>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-[var(--muted)] max-w-md">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <code className="text-xs text-[var(--muted)] font-mono">{error.digest}</code>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RefreshCw className="h-4 w-4 mr-2" /> Try again
        </Button>
        <Link href="/">
          <Button>
            <Home className="h-4 w-4 mr-2" /> Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
