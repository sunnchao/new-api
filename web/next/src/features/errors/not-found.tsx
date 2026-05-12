"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-8xl font-bold text-[var(--accent)]">404</span>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-[var(--muted)] max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
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
