"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface InlineCitationSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface InlineCitationProps extends React.HTMLAttributes<HTMLButtonElement> {
  index: number;
  source?: InlineCitationSource;
}

const hostFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const InlineCitation = React.forwardRef<HTMLButtonElement, InlineCitationProps>(
  ({ index, source, className, ...props }, ref) => {
    const trigger = (
      <button
        ref={ref}
        type="button"
        className={cn(
          "ml-0.5 inline-flex h-[1.1em] min-w-[1.1em] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-1 align-text-top text-[0.65em] font-medium leading-none text-[var(--muted)] transition-colors duration-150 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          className
        )}
        aria-label={source ? `Source ${index}: ${source.title}` : `Citation ${index}`}
        {...props}
      >
        {index}
      </button>
    );

    if (!source) return trigger;

    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-80 p-3 text-xs"
        >
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="line-clamp-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors duration-150"
              >
                {source.title}
              </a>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="shrink-0 text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-150"
                aria-label="Open source"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="truncate font-mono text-[0.7rem] text-[var(--muted)]">
              {hostFromUrl(source.url)}
            </div>
            {source.snippet && (
              <p className="line-clamp-4 leading-relaxed text-[var(--muted)]">
                {source.snippet}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
InlineCitation.displayName = "InlineCitation";

export { InlineCitation };
