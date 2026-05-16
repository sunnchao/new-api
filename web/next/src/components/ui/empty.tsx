"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-8 text-center",
      className
    )}
    {...props}
  />
));
Empty.displayName = "Empty";

const EmptyIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted)] [&>svg]:h-6 [&>svg]:w-6",
      className
    )}
    {...props}
  />
));
EmptyIcon.displayName = "EmptyIcon";

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-tight text-[var(--foreground)]",
      className
    )}
    {...props}
  />
));
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "max-w-sm text-sm leading-relaxed text-[var(--muted)]",
      className
    )}
    {...props}
  />
));
EmptyDescription.displayName = "EmptyDescription";

const EmptyContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-2 flex flex-wrap items-center justify-center gap-2", className)}
    {...props}
  />
));
EmptyContent.displayName = "EmptyContent";

// Aliases for compatibility with default frontend
export const EmptyMedia = EmptyIcon;
export const EmptyHeader = EmptyTitle;

export { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyContent };
