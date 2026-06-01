"use client";

import * as React from "react";
import { ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SourceData {
  title: string;
  url: string;
  snippet?: string;
  favicon?: string;
}

export type { SourceData as SourceType };

export interface SourceProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
}

const Source = React.forwardRef<HTMLAnchorElement, SourceProps>(
  ({ title, href, className, children, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "group/source flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 p-3 text-xs transition-colors duration-150 hover:border-[var(--accent)]/60 hover:bg-[var(--surface)]",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-medium text-[var(--foreground)]">
          {title}
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-colors duration-150 group-hover/source:text-[var(--accent)]" />
      </div>
      {children}
    </a>
  )
);
Source.displayName = "Source";

export interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  sources: SourceData[];
  label?: string;
}

const hostFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const Sources = React.forwardRef<HTMLDivElement, SourcesProps>(
  ({ sources, label = "Sources", className, ...props }, ref) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div
        ref={ref}
        className={cn("my-3", className)}
        {...props}
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          <Globe className="h-3.5 w-3.5" />
          <span>
            {label} ({sources.length})
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sources.map((source, idx) => (
            <a
              key={`${source.url}-${idx}`}
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group/source flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 p-3 text-xs transition-colors duration-150 hover:border-[var(--accent)]/60 hover:bg-[var(--surface)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 text-sm font-medium text-[var(--foreground)]">
                  {source.title}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-colors duration-150 group-hover/source:text-[var(--accent)]" />
              </div>
              <span className="truncate text-[var(--muted)]">{hostFromUrl(source.url)}</span>
              {source.snippet && (
                <span className="line-clamp-2 text-[var(--muted)] leading-relaxed">
                  {source.snippet}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    );
  }
);
Sources.displayName = "Sources";

const SourcesTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
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
SourcesTrigger.displayName = "SourcesTrigger";

const SourcesContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)} {...props} />
  )
);
SourcesContent.displayName = "SourcesContent";

export { Sources, Source, SourcesContent, SourcesTrigger };
