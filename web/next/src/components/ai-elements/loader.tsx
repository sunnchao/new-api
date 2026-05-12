"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "h-1 w-1",
  md: "h-1.5 w-1.5",
  lg: "h-2 w-2",
};

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ size = "md", label = "Thinking", className, ...props }, ref) => {
    const dot = sizeMap[size];
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-1.5 text-[var(--muted)]",
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-1">
          <span
            className={cn("rounded-full bg-[var(--muted)] animate-pulse", dot)}
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <span
            className={cn("rounded-full bg-[var(--muted)] animate-pulse", dot)}
            style={{ animationDelay: "150ms", animationDuration: "1s" }}
          />
          <span
            className={cn("rounded-full bg-[var(--muted)] animate-pulse", dot)}
            style={{ animationDelay: "300ms", animationDuration: "1s" }}
          />
        </span>
      </div>
    );
  }
);
Loader.displayName = "Loader";

export { Loader };
