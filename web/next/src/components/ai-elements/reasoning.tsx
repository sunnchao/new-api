"use client";

import * as React from "react";
import { Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  duration?: number;
  label?: string;
  streaming?: boolean;
}

const Reasoning = React.forwardRef<HTMLDivElement, ReasoningProps>(
  ({ defaultOpen = false, duration, label, streaming, className, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen);

    const header = label
      ? label
      : streaming
      ? "Thinking..."
      : duration !== undefined
      ? `Thought for ${duration}s`
      : "Reasoning";

    return (
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        className={cn(
          "my-2 rounded-lg border-l-2 border-[var(--accent)]/60 bg-[var(--surface)]/40 transition-colors duration-150",
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--muted)] transition-colors duration-150 hover:text-[var(--foreground)]",
            streaming && "text-[var(--foreground)]"
          )}
          aria-expanded={open}
        >
          <Brain
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              streaming && "animate-pulse text-[var(--accent)]"
            )}
          />
          <span className="flex-1">{header}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        {open && (
          <div className="px-3 pb-3 pt-1 text-xs leading-relaxed text-[var(--muted)]">
            <div className="border-l border-[var(--border)] pl-3">{children}</div>
          </div>
        )}
      </div>
    );
  }
);
Reasoning.displayName = "Reasoning";

const ReasoningTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn("flex items-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]", className)}
      {...props}
    >
      {children}
    </button>
  )
);
ReasoningTrigger.displayName = "ReasoningTrigger";

const ReasoningContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-3 pb-3 pt-1 text-xs leading-relaxed text-[var(--muted)]", className)} {...props} />
  )
);
ReasoningContent.displayName = "ReasoningContent";

export { Reasoning, ReasoningContent, ReasoningTrigger };
