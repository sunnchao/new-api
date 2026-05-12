"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Wrench } from "lucide-react";

export function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-3">
        <Wrench className="h-16 w-16 text-[var(--warning)] animate-pulse" />
        <span className="font-mono text-8xl font-bold text-[var(--warning)]">503</span>
        <h1 className="text-2xl font-semibold">Under maintenance</h1>
        <p className="text-[var(--muted)] max-w-md">
          We&apos;re performing scheduled maintenance. We&apos;ll be back shortly.
        </p>
      </div>
      <Button variant="outline" onClick={() => location.reload()}>
        Try again
      </Button>
    </div>
  );
}
