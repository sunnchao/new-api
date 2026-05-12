"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}) {
  const variants: Record<string, string> = {
    default: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    secondary: "bg-[var(--surface)] text-[var(--foreground)]",
    destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)]",
    outline: "border border-[var(--border)] text-[var(--foreground)]",
    success: "bg-[var(--success)] text-[var(--success-foreground)]",
    warning: "bg-[var(--warning)] text-[var(--warning-foreground)]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
