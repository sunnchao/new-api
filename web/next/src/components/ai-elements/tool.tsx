"use client";

import * as React from "react";
import { ChevronDown, Loader2, Wrench, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolStatus = "pending" | "running" | "complete" | "error";

export interface ToolProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  args?: unknown;
  result?: unknown;
  status?: ToolStatus;
  defaultOpen?: boolean;
}

const statusLabel: Record<ToolStatus, string> = {
  pending: "Pending",
  running: "Running",
  complete: "Complete",
  error: "Error",
};

const statusIcon = (status: ToolStatus) => {
  switch (status) {
    case "running":
      return <Loader2 className="h-3 w-3 animate-spin text-[var(--accent)]" />;
    case "complete":
      return <Check className="h-3 w-3 text-[var(--success)]" />;
    case "error":
      return <X className="h-3 w-3 text-[var(--destructive)]" />;
    default:
      return <Loader2 className="h-3 w-3 text-[var(--muted)]" />;
  }
};

const formatJson = (v: unknown): string => {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

const Tool = React.forwardRef<HTMLDivElement, ToolProps>(
  ({ name, args, result, status = "complete", defaultOpen = false, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen);
    const hasResult = result !== undefined && result !== null;
    const hasArgs = args !== undefined && args !== null;

    return (
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        className={cn(
          "my-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 transition-colors duration-150",
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--surface)]"
          aria-expanded={open}
        >
          <Wrench className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <span className="flex-1 truncate font-mono">{name}</span>
          <span className="flex items-center gap-1.5 text-[var(--muted)]">
            {statusIcon(status)}
            <span className="text-[0.7rem] uppercase tracking-wide">{statusLabel[status]}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        {open && (
          <div className="space-y-2 border-t border-[var(--border)] px-3 py-2 text-xs">
            {hasArgs && (
              <div>
                <div className="mb-1 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                  Arguments
                </div>
                <pre className="overflow-x-auto rounded border border-[var(--border)] bg-[#0a0a0a] p-2 font-mono text-[0.75rem] leading-relaxed text-[var(--foreground)]">
                  {formatJson(args)}
                </pre>
              </div>
            )}
            {hasResult && (
              <div>
                <div className="mb-1 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                  Result
                </div>
                <pre className="overflow-x-auto rounded border border-[var(--border)] bg-[#0a0a0a] p-2 font-mono text-[0.75rem] leading-relaxed text-[var(--foreground)]">
                  {formatJson(result)}
                </pre>
              </div>
            )}
            {!hasArgs && !hasResult && (
              <div className="text-[var(--muted)]">No arguments or result.</div>
            )}
          </div>
        )}
      </div>
    );
  }
);
Tool.displayName = "Tool";

export { Tool };
