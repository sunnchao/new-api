"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface BranchProps extends React.HTMLAttributes<HTMLDivElement> {
  current: number;
  total: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

const Branch = React.forwardRef<HTMLDivElement, BranchProps>(
  ({ current, total, onPrevious, onNext, className, ...props }, ref) => {
    if (total <= 1) return null;

    const canPrev = current > 1;
    const canNext = current < total;

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/40 p-0.5 text-xs",
          className
        )}
        {...props}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
          onClick={onPrevious}
          disabled={!canPrev || !onPrevious}
          aria-label="Previous branch"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span
          className="min-w-[2.5rem] select-none text-center font-mono text-[var(--muted)]"
          aria-live="polite"
        >
          {current}/{total}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
          onClick={onNext}
          disabled={!canNext || !onNext}
          aria-label="Next branch"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }
);
Branch.displayName = "Branch";

const BranchMessages = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col", className)} {...props} />
  )
);
BranchMessages.displayName = "BranchMessages";

const BranchNext = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <Button ref={ref} type="button" variant="ghost" size="icon" className={cn("h-6 w-6", className)} {...props}>
      {children ?? <ChevronRight className="h-3.5 w-3.5" />}
    </Button>
  )
);
BranchNext.displayName = "BranchNext";

const BranchPrevious = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <Button ref={ref} type="button" variant="ghost" size="icon" className={cn("h-6 w-6", className)} {...props}>
      {children ?? <ChevronLeft className="h-3.5 w-3.5" />}
    </Button>
  )
);
BranchPrevious.displayName = "BranchPrevious";

const BranchPage = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("min-w-[2.5rem] select-none text-center font-mono text-xs text-[var(--muted)]", className)} {...props} />
  )
);
BranchPage.displayName = "BranchPage";

const BranchSelector = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("inline-flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/40 p-0.5", className)} {...props} />
  )
);
BranchSelector.displayName = "BranchSelector";

export { Branch, BranchMessages, BranchNext, BranchPage, BranchPrevious, BranchSelector };
