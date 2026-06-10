import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg" | string;
}

export function LoadingState({
  message,
  className,
  fullScreen = false,
  size = "md",
}: LoadingStateProps) {
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-[var(--muted)]",
        fullScreen ? "min-h-[60vh] w-full" : "py-12",
        className
      )}
    >
      <Loader2 className={cn(iconSize, "animate-spin text-[var(--accent)]")} />
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
