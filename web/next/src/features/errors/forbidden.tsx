"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ShieldX } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";

export function ForbiddenPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <ShieldX className="h-16 w-16 text-[var(--destructive)] mb-2" />
          <span className="font-mono text-8xl font-bold text-[var(--destructive)]">403</span>
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="text-[var(--muted)] max-w-md">
            You don&apos;t have permission to access this resource.
          </p>
        </div>
        <Link href="/">
          <Button>
            <Home className="h-4 w-4 mr-2" /> Go home
          </Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
