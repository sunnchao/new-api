"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuggestionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  icon?: React.ReactNode;
}

const Suggestion = React.forwardRef<HTMLDivElement, SuggestionProps>(
  ({ suggestions, onSelect, icon, className, ...props }, ref) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap gap-2 overflow-x-auto pb-1",
          className
        )}
        {...props}
      >
        {suggestions.map((s, idx) => (
          <button
            key={`${s}-${idx}`}
            type="button"
            onClick={() => onSelect(s)}
            className="group/chip inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/40 px-3 py-1.5 text-xs text-[var(--foreground)] transition-colors duration-150 hover:border-[var(--accent)]/60 hover:bg-[var(--surface)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span className="text-[var(--muted)] transition-colors duration-150 group-hover/chip:text-[var(--accent)]">
              {icon ?? <Sparkles className="h-3 w-3" />}
            </span>
            <span>{s}</span>
          </button>
        ))}
      </div>
    );
  }
);
Suggestion.displayName = "Suggestion";

export { Suggestion };
