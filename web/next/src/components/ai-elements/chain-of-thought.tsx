"use client";

import * as React from "react";
import { Check, Circle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChainOfThoughtStatus = "pending" | "active" | "complete" | "error";

export interface ChainOfThoughtStep {
  id: string;
  title: string;
  description?: string;
  status: ChainOfThoughtStatus;
}

export interface ChainOfThoughtProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: ChainOfThoughtStep[];
}

const statusIconMap: Record<
  ChainOfThoughtStatus,
  { Icon: React.ElementType; className: string }
> = {
  pending: { Icon: Circle, className: "text-[var(--muted)]" },
  active: { Icon: Loader2, className: "animate-spin text-[var(--accent)]" },
  complete: { Icon: Check, className: "text-[var(--success)]" },
  error: { Icon: X, className: "text-[var(--destructive)]" },
};

const ChainOfThought = React.forwardRef<HTMLDivElement, ChainOfThoughtProps>(
  ({ steps, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative my-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 p-3",
          className
        )}
        {...props}
      >
        <ol className="relative space-y-3">
          {steps.map((step, idx) => {
            const { Icon, className: iconCn } = statusIconMap[step.status];
            const isLast = idx === steps.length - 1;

            return (
              <li key={step.id} className="relative flex gap-3">
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[11px] top-5 h-[calc(100%+0.5rem)] w-px",
                      step.status === "complete"
                        ? "bg-[var(--success)]/40"
                        : "bg-[var(--border)]"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border bg-[var(--background)] transition-colors duration-150",
                    step.status === "active"
                      ? "border-[var(--accent)]"
                      : step.status === "complete"
                      ? "border-[var(--success)]"
                      : step.status === "error"
                      ? "border-[var(--destructive)]"
                      : "border-[var(--border)]"
                  )}
                >
                  <Icon className={cn("h-3 w-3", iconCn)} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div
                    className={cn(
                      "text-sm font-medium transition-colors duration-150",
                      step.status === "pending"
                        ? "text-[var(--muted)]"
                        : "text-[var(--foreground)]"
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="mt-0.5 text-xs text-[var(--muted)] leading-relaxed">
                      {step.description}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }
);
ChainOfThought.displayName = "ChainOfThought";

export { ChainOfThought };
