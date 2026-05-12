"use client";

import * as React from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ArtifactProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  language?: string;
  icon?: React.ReactNode;
  onOpen?: () => void;
  description?: string;
}

const Artifact = React.forwardRef<HTMLDivElement, ArtifactProps>(
  ({ title, language, icon, onOpen, description, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group/artifact my-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 transition-colors duration-150 hover:border-[var(--accent)]/40",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3 border-b border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--background)] text-[var(--accent)]">
            {icon ?? <FileText className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-medium text-[var(--foreground)]">{title}</h4>
              {language && (
                <span className="rounded bg-[var(--background)] px-1.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                  {language}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-0.5 text-xs text-[var(--muted)] line-clamp-1">{description}</p>
            )}
          </div>
          {onOpen && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={onOpen}
            >
              Open
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          )}
        </div>
        {children && (
          <div className="relative max-h-64 overflow-hidden">
            <div className="p-3">{children}</div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--surface)]/80 to-transparent" />
          </div>
        )}
      </div>
    );
  }
);
Artifact.displayName = "Artifact";

export { Artifact };
