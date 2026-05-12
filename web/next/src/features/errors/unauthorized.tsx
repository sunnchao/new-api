"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, LogIn } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";

export function UnauthorizedPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-8xl font-bold text-[var(--warning)]">401</span>
          <h1 className="text-2xl font-semibold">Authentication required</h1>
          <p className="text-[var(--muted)] max-w-md">
            You need to sign in to access this page.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" /> Home
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button>
              <LogIn className="h-4 w-4 mr-2" /> Sign in
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
