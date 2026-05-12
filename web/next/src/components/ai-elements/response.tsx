"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

export interface ResponseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  content: string;
  components?: Components;
}

const markdownComponents: Components = {
  p: ({ className, ...props }) => (
    <p className={cn("my-2 leading-relaxed", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "text-[var(--accent)] underline underline-offset-4 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] transition-colors duration-150",
        className
      )}
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-6 mb-3 text-xl font-semibold tracking-tight text-[var(--foreground)]",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-5 mb-2 text-lg font-semibold tracking-tight text-[var(--foreground)]",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-4 mb-2 text-base font-semibold tracking-tight text-[var(--foreground)]",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-3 mb-2 text-sm font-semibold text-[var(--foreground)]", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-2 list-disc space-y-1 pl-6", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-2 list-decimal space-y-1 pl-6", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-3 border-l-2 border-[var(--accent)] bg-[var(--surface)]/50 px-4 py-2 italic text-[var(--muted)]",
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-4 border-[var(--border)]", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="my-3 w-full overflow-x-auto rounded-md border border-[var(--border)]">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead
      className={cn("bg-[var(--surface)] text-[var(--foreground)]", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border-b border-[var(--border)] px-3 py-2 text-left font-medium",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn("border-b border-[var(--border)]/60 px-3 py-2 align-top", className)}
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className={cn(
            "rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--foreground)] border border-[var(--border)]/60",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono text-[0.85em]", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-3 overflow-x-auto rounded-md border border-[var(--border)] bg-[#0a0a0a] p-3 font-mono text-xs leading-relaxed text-[var(--foreground)]",
        className
      )}
      {...props}
    />
  ),
  img: ({ className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt ?? ""}
      className={cn("my-2 max-w-full rounded-md border border-[var(--border)]", className)}
      {...props}
    />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-[var(--foreground)]", className)} {...props} />
  ),
  em: ({ className, ...props }) => (
    <em className={cn("italic", className)} {...props} />
  ),
};

const Response = React.forwardRef<HTMLDivElement, ResponseProps>(
  ({ content, className, components, ...props }, ref) => {
    const merged = React.useMemo<Components>(
      () => ({ ...markdownComponents, ...(components ?? {}) }),
      [components]
    );

    return (
      <div
        ref={ref}
        className={cn(
          "text-sm text-[var(--foreground)] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          className
        )}
        {...props}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={merged}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);
Response.displayName = "Response";

export { Response };
